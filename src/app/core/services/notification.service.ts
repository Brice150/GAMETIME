import { inject, Injectable } from '@angular/core';
import { getApp } from '@angular/fire/app';
import {
  arrayRemove,
  arrayUnion,
  doc,
  Firestore,
  updateDoc,
} from '@angular/fire/firestore';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
} from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { PlayerService } from './player.service';

// Deux niveaux de notification :
//  - onglet ouvert en arriere-plan : notification systeme locale, declenchee
//    par l'ecoute Firestore des invitations ;
//  - onglet ferme : push FCM envoyee par la fonction `notifyInvitation`, ce
//    qui suppose un jeton enregistre sur la fiche joueur.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  firestore = inject(Firestore);
  playerService = inject(PlayerService);
  private readonly storageKey = 'invitationNotifications';

  get isSupported(): boolean {
    return typeof Notification !== 'undefined';
  }

  get isBlocked(): boolean {
    return this.isSupported && Notification.permission === 'denied';
  }

  get isEnabled(): boolean {
    return (
      this.isSupported &&
      Notification.permission === 'granted' &&
      localStorage.getItem(this.storageKey) !== 'false'
    );
  }

  // La demande de permission doit partir d'un geste de l'utilisateur : elle
  // est declenchee par l'interrupteur des parametres, jamais au chargement.
  async enable(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const permission =
      Notification.permission === 'granted'
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

  // Sans cle VAPID configuree, seule la notification locale fonctionne.
  private async registerPushToken(): Promise<void> {
    const player = this.playerService.currentPlayerSig();

    if (!environment.vapidKey || !player?.id) {
      return;
    }

    try {
      if (!(await isSupported())) {
        return;
      }

      const token = await getToken(getMessaging(getApp()), {
        vapidKey: environment.vapidKey,
      });

      if (!token) {
        return;
      }

      await updateDoc(doc(this.firestore, `players/${player.id}`), {
        fcmTokens: arrayUnion(token),
      });
    } catch {
      // Push indisponible : les notifications locales restent actives.
    }
  }

  private async unregisterPushToken(): Promise<void> {
    const player = this.playerService.currentPlayerSig();

    if (!environment.vapidKey || !player?.id) {
      return;
    }

    try {
      if (!(await isSupported())) {
        return;
      }

      const messaging = getMessaging(getApp());
      const token = await getToken(messaging, {
        vapidKey: environment.vapidKey,
      });

      if (token) {
        await updateDoc(doc(this.firestore, `players/${player.id}`), {
          fcmTokens: arrayRemove(token),
        });
        await deleteToken(messaging);
      }
    } catch {
      // Rien a faire : le jeton sera purge au premier envoi en echec.
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
