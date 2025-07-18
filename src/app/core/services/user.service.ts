import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  user,
  UserCredential,
} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  auth = inject(Auth);
  user$ = user(this.auth);
  currentUserSig = signal<User | null | undefined>(undefined);

  register(user: User): Observable<UserCredential> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      user.email,
      user.password!
    );

    return from(promise);
  }

  login(user: User): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(
      this.auth,
      user.email,
      user.password!
    );

    return from(promise);
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
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
