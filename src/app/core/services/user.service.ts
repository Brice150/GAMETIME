import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  signOut,
  user,
  UserCredential,
} from '@angular/fire/auth';
import { firstValueFrom, from, Observable, throwError } from 'rxjs';
import { User } from '../interfaces/user';
import { GameApiService } from './game-api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  auth = inject(Auth);
  gameApi = inject(GameApiService);
  user$ = user(this.auth);
  currentUserSig = signal<User | null | undefined>(undefined);
  // URL demandee avant la connexion : un lien de room partage ne doit pas
  // etre perdu par le passage sur la page d'accueil.
  redirectUrl: string | null = null;
  private popupWarmedUp = false;

  // Firebase charge un iframe `gapi` avant d'ouvrir la fenetre de connexion.
  // Au tout premier passage sur le site rien n'est en cache : cette attente
  // consomme l'autorisation d'ouvrir une fenetre accordee par le clic, et la
  // connexion Google echoue en `auth/popup-blocked` jusqu'a un rechargement
  // force. Prechauffe des l'affichage de la page de connexion, l'iframe est
  // deja pret et la fenetre s'ouvre dans le clic.
  warmUpSignInPopup(): void {
    if (this.popupWarmedUp || typeof window === 'undefined') {
      return;
    }

    this.popupWarmedUp = true;

    const resolver = (
      this.auth as unknown as {
        _popupRedirectResolver?: {
          _initialize?: (auth: unknown) => Promise<unknown>;
        };
      }
    )._popupRedirectResolver;

    // Un echec n'a aucune consequence visible : la connexion reprend le
    // chemin habituel, simplement sans l'avance prise.
    resolver?._initialize?.(this.auth).catch(() => {
      this.popupWarmedUp = false;
    });
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    const promise = signInWithPopup(this.auth, provider);
    return from(promise);
  }

  signInWithGithub(): Observable<UserCredential> {
    const provider = new GithubAuthProvider();
    const promise = signInWithPopup(this.auth, provider);
    return from(promise);
  }

  signInAsGuest(): Observable<UserCredential> {
    return from(signInAnonymously(this.auth));
  }

  linkAnonymousAccountWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return this.linkAnonymousAccountWithProvider(provider);
  }

  linkAnonymousAccountWithGithub(): Observable<UserCredential> {
    const provider = new GithubAuthProvider();
    return this.linkAnonymousAccountWithProvider(provider);
  }

  private linkAnonymousAccountWithProvider(
    provider: GoogleAuthProvider | GithubAuthProvider,
  ): Observable<UserCredential> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return throwError(() => new Error('Aucun utilisateur connecté.'));
    }

    if (!currentUser.isAnonymous) {
      return throwError(
        () => new Error('Le compte courant n est pas un compte temporaire.'),
      );
    }

    // Le jeton du compte invite est preleve avant tout changement de compte :
    // c'est la seule preuve que la fonction de migration acceptera ensuite.
    const guestIdTokenPromise = currentUser.getIdToken();

    const promise = linkWithPopup(currentUser, provider)
      .catch(async (error: { code?: string; message?: string }) => {
        if (
          error.code === 'auth/credential-already-in-use' ||
          error.code === 'auth/account-exists-with-different-credential' ||
          error.code === 'auth/email-already-in-use'
        ) {
          const guestIdToken = await guestIdTokenPromise;
          const existingAccountCredential = await signInWithPopup(
            this.auth,
            provider,
          );

          // La reprise de progression se fait cote serveur : le client n'a
          // plus le droit d'ecrire sur la fiche du compte invite.
          await firstValueFrom(this.gameApi.linkGuestAccount(guestIdToken));

          return existingAccountCredential;
        }

        throw error;
      })
      .then((userCredential) => {
        this.currentUserSig.set({
          email: userCredential.user.email ?? 'Compte invité',
          isAnonymous: false,
        });

        return userCredential;
      });

    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.auth);
    this.currentUserSig.set(null);

    return from(promise);
  }
}
