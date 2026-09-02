import { inject, Injectable, signal } from '@angular/core';
import {
  ActionCodeSettings,
  Auth,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  linkWithPopup,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  user,
  UserCredential,
} from '@angular/fire/auth';
import { catchError, firstValueFrom, from, Observable, throwError } from 'rxjs';
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
  private readonly emailLinkStorageKey = 'emailForSignIn';

  private getEmailLinkSettings(): ActionCodeSettings {
    return {
      url: `${window.location.origin}/`,
      handleCodeInApp: true,
    };
  }

  sendEmailSignInLink(email: string): Observable<void> {
    const normalizedEmail = email.trim().toLowerCase();
    localStorage.setItem(this.emailLinkStorageKey, normalizedEmail);

    const promise = sendSignInLinkToEmail(
      this.auth,
      normalizedEmail,
      this.getEmailLinkSettings(),
    );
    return from(promise);
  }

  isEmailSignInLink(url: string): boolean {
    return isSignInWithEmailLink(this.auth, url);
  }

  getStoredEmailForSignIn(): string | null {
    return localStorage.getItem(this.emailLinkStorageKey);
  }

  completeEmailLinkSignIn(
    email: string,
    url: string,
  ): Observable<UserCredential> {
    const normalizedEmail = email.trim().toLowerCase();
    return from(signInWithEmailLink(this.auth, normalizedEmail, url)).pipe(
      catchError((error) => throwError(() => error)),
    );
  }

  clearStoredEmailForSignIn(): void {
    localStorage.removeItem(this.emailLinkStorageKey);
  }

  register(user: User): Observable<UserCredential> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      user.email,
      user.password!,
    );

    return from(promise);
  }

  login(user: User): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(
      this.auth,
      user.email,
      user.password!,
    );

    return from(promise);
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

  passwordReset(email: string): Observable<void> {
    const promise = sendPasswordResetEmail(this.auth, email);
    return from(promise);
  }
}
