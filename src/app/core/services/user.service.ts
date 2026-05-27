import { inject, Injectable, signal } from '@angular/core';
import {
  ActionCodeSettings,
  AuthCredential,
  Auth,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  linkWithCredential,
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
import { deleteApp, initializeApp } from 'firebase/app';
import { catchError, from, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  auth = inject(Auth);
  user$ = user(this.auth);
  currentUserSig = signal<User | null | undefined>(undefined);
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
    return this.linkAnonymousAccountWithProviderCredential(provider, 'google');
  }

  linkAnonymousAccountWithGithub(): Observable<UserCredential> {
    const provider = new GithubAuthProvider();
    return this.linkAnonymousAccountWithProviderCredential(provider, 'github');
  }

  private linkAnonymousAccountWithProviderCredential(
    provider: GoogleAuthProvider | GithubAuthProvider,
    providerName: 'google' | 'github',
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

    const promise = this.getProviderCredentialFromPopup(provider, providerName)
      .then((credential) => linkWithCredential(currentUser, credential))
      .then((userCredential) => {
        this.currentUserSig.set({
          email: userCredential.user.email ?? 'Compte invité',
          isAnonymous: false,
        });

        return userCredential;
      });

    return from(promise);
  }

  private async getProviderCredentialFromPopup(
    provider: GoogleAuthProvider | GithubAuthProvider,
    providerName: 'google' | 'github',
  ): Promise<AuthCredential> {
    const appName = `gametime-link-${providerName}-${Date.now()}`;
    const secondaryApp = initializeApp(environment.firebase, appName);
    const { getAuth } = await import('@angular/fire/auth');
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const result = await signInWithPopup(secondaryAuth, provider);
      const credential =
        providerName === 'google'
          ? GoogleAuthProvider.credentialFromResult(result)
          : GithubAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error(
          `Impossible de récupérer le credential ${providerName}.`,
        );
      }

      return credential;
    } finally {
      await signOut(secondaryAuth).catch(() => undefined);
      await deleteApp(secondaryApp).catch(() => undefined);
    }
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
