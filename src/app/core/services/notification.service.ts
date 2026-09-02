import { inject, Injectable } from '@angular/core';
import { getApp } from '@angular/fire/app';
import { deleteDoc, doc, Firestore, setDoc } from '@angular/fire/firestore';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  Messaging,
} from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';

// Deux canaux :
//  - onglet ouvert : l'ecoute Firestore des invitations declenche un toast et,
//    si l'onglet est en arriere-plan, une notification systeme locale ;
//  - onglet ferme : push FCM envoyee par la fonction `notifyInvitation`, ce qui
//    suppose un jeton enregistre dans la collection `fcmTokens`.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  private readonly storageKey = 'invitationNotifications';
  private messaging: Messaging | null = null;

  get permission(): NotificationPermission | 'unsupported' {
    return typeof Notification === 'undefined'
      ? 'unsupported'
      : Notification.permission;
  }

  get isSupported(): boolean {
    return this.permission !== 'unsupported';
  }

  get isBlocked(): boolean {
    return this.permission === 'denied';
  }

  get isEnabled(): boolean {
    return (
      this.permission === 'granted' &&
      localStorage.getItem(this.storageKey) !== 'false'
    );
  }

  // Sans cle VAPID, seules les notifications locales fonctionnent.
  get isPushConfigured(): boolean {
    return !!environment.vapidKey;
  }

  private get isIos(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  private get isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  // iOS n'autorise le push que depuis une application ajoutee a l'ecran
  // d'accueil : c'est la cause la plus frequente de « j'ai active, je ne
  // recois rien » sur iPhone.
  get requiresInstall(): boolean {
    return this.isIos && !this.isInstalled;
  }

  async isPushAvailable(): Promise<boolean> {
    try {
      return this.isPushConfigured && (await isSupported());
    } catch {
      return false;
    }
  }

  // La demande de permission doit partir d'un geste de l'utilisateur : elle
  // est declenchee par l'interrupteur des parametres, jamais au chargement.
  async enable(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const permission =
      this.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

    if (permission !== 'granted') {
      return false;
    }

    localStorage.setItem(this.storageKey, 'true');
    await this.registerPushToken();
    return true;
  }

  async disable(): Promise<void> {
    localStorage.setItem(this.storageKey, 'false');
    await this.unregisterPushToken();
  }

  /**
   * Les jetons FCM tournent (reinstallation, nettoyage du navigateur, simple
   * expiration) : sans reenregistrement au demarrage, le push s'arrete sans
   * prevenir quelques semaines apres l'activation.
   */
  async initOnStartup(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    await this.registerPushToken();
  }

  // Onglet au premier plan : le toast de l'application suffit, doubler d'une
  // notification systeme serait du bruit.
  notify(title: string, body: string, tag?: string): void {
    if (!this.isEnabled || !document.hidden) {
      return;
    }

    const options: NotificationOptions = { body, tag };

    // Android n'autorise la construction directe que depuis le service
    // worker : on passe par lui quand il est disponible.
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) {
            return registration.showNotification(title, options);
          }

          this.showDirectNotification(title, options);
          return undefined;
        })
        .catch(() => this.showDirectNotification(title, options));
      return;
    }

    this.showDirectNotification(title, options);
  }

  private async getMessagingInstance(): Promise<Messaging | null> {
    if (!(await this.isPushAvailable())) {
      return null;
    }

    this.messaging ??= getMessaging(getApp());
    return this.messaging;
  }

  // Un document par jeton : un compte peut recevoir sur plusieurs appareils,
  // et un jeton mort se supprime sans toucher a la fiche joueur.
  private async registerPushToken(): Promise<void> {
    const userId = this.userService.auth.currentUser?.uid;
    const messaging = await this.getMessagingInstance();

    if (!userId || !messaging) {
      return;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: environment.vapidKey,
      });

      if (!token) {
        return;
      }

      await setDoc(doc(this.firestore, `fcmTokens/${token}`), {
        token,
        userId,
        updatedAt: new Date(),
      });
    } catch {
      // Push indisponible : les notifications locales restent actives.
    }
  }

  private async unregisterPushToken(): Promise<void> {
    const messaging = await this.getMessagingInstance();

    if (!messaging) {
      return;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: environment.vapidKey,
      });

      if (token) {
        await deleteDoc(doc(this.firestore, `fcmTokens/${token}`));
        await deleteToken(messaging);
      }
    } catch {
      // Le jeton sera purge au premier envoi en echec.
    }
  }

  private showDirectNotification(
    title: string,
    options: NotificationOptions,
  ): void {
    try {
      new Notification(title, options);
    } catch {
      // Notification refusee par la plateforme : le toast a deja informe.
    }
  }
}
