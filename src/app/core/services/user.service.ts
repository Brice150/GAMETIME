import { inject, Injectable, signal } from '@angular/core';
import {
  ActionCodeSettings,
  Auth,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  user,
  UserCredential,
} from '@angular/fire/auth';
import { catchError, from, Observable, throwError } from 'rxjs';
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
