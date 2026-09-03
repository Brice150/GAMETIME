import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, take } from 'rxjs';
import { LoggingService } from './logging.service';

// Rien de ce que renvoie Firebase n'est lisible par un joueur : les codes
// connus sont traduits, le reste est journalise et remplace par un message
// generique.
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Identifiants incorrects',
  'auth/wrong-password': 'Identifiants incorrects',
  'auth/user-not-found': 'Identifiants incorrects',
  'auth/invalid-email': 'Adresse email invalide',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum)',
  'auth/too-many-requests': 'Trop de tentatives, réessayez dans un instant',
  'auth/network-request-failed': 'Connexion impossible, vérifiez votre réseau',
  'auth/popup-blocked':
    'La fenêtre de connexion a été bloquée par le navigateur',
  'auth/requires-recent-login': 'Reconnectez-vous pour effectuer cette action',
  'auth/account-exists-with-different-credential':
    'Un compte existe déjà avec une autre méthode de connexion',
  'auth/user-disabled': 'Ce compte a été désactivé',
  unavailable: 'Service momentanément indisponible, réessayez',
  unauthenticated: 'Connexion requise',
  'not-found': 'Élément introuvable',
};

// Situations normales : le joueur ferme la fenetre de connexion, ou une
// ecoute Firestore s'arrete a la deconnexion.
const SILENT = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
  'Missing or insufficient permissions.',
  'permission-denied',
];

@Injectable({ providedIn: 'root' })
export class ToastrHelperService {
  private toastr = inject(ToastrService);
  private logging = inject(LoggingService);

  private readonly BASE_OPTIONS = {
    positionClass: 'toast-bottom-center',
  };

  error(message: string): void {
    this.toastr.error(message, 'Erreur', {
      ...this.BASE_OPTIONS,
      toastClass: 'ngx-toastr custom error',
    });
  }

  info(message: string, title: string): void {
    this.toastr.info(message, title, {
      ...this.BASE_OPTIONS,
      toastClass: 'ngx-toastr custom info',
    });
  }

  installPrompt(): Observable<'install' | 'never'> {
    const result = new Subject<'install' | 'never'>();

    const body =
      'Installez Game Time sur votre appareil pour y revenir en un geste. ' +
      '<span class="toast-action">Installer</span> ' +
      '<span class="toast-dismiss">Ne plus demander</span>';

    const toast = this.toastr.info(body, 'Installation', {
      ...this.BASE_OPTIONS,
      toastClass: 'ngx-toastr custom info',
      enableHtml: true,
      tapToDismiss: false,
      closeButton: true,
      timeOut: 0,
      disableTimeOut: true,
    });

    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      const install = target?.closest('.toast-action');
      const never = target?.closest('.toast-dismiss');
      if (!install && !never) return;

      cleanup();
      this.toastr.clear(toast.toastId);
      result.next(never ? 'never' : 'install');
      result.complete();
    };

    const cleanup = (): void =>
      document.removeEventListener('click', onClick, true);

    document.addEventListener('click', onClick, true);

    toast.onHidden.pipe(take(1)).subscribe(() => {
      cleanup();
      result.complete();
    });

    return result.asObservable();
  }

  handleError(error: unknown): void {
    this.logging.logError(error);

    const identifier = this.identify(error);

    if (SILENT.some((pattern) => identifier.includes(pattern))) {
      return;
    }

    this.error(this.translate(identifier));
  }

  private identify(error: unknown): string {
    const candidate = error as { code?: unknown; message?: unknown };
    const code = typeof candidate?.code === 'string' ? candidate.code : '';
    const message =
      typeof candidate?.message === 'string' ? candidate.message : '';

    return `${code} ${message}`.trim();
  }

  private translate(identifier: string): string {
    const known = Object.keys(MESSAGES).find((code) =>
      identifier.includes(code),
    );

    return known
      ? MESSAGES[known]
      : 'Une erreur est survenue, réessayez dans un instant';
  }
}
