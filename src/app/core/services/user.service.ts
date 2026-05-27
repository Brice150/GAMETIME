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
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { catchError, from, Observable, throwError } from 'rxjs';
import { ExcludedUserQuestions } from '../interfaces/excluded-user-questions';
import { Player } from '../interfaces/player';
import { Room } from '../interfaces/room';
import { Stat } from '../interfaces/stat';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  auth = inject(Auth);
  firestore = inject(Firestore);
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

    const promise = linkWithPopup(currentUser, provider)
      .catch(async (error: { code?: string; message?: string }) => {
        if (
          error.code === 'auth/credential-already-in-use' ||
          error.code === 'auth/account-exists-with-different-credential' ||
          error.code === 'auth/email-already-in-use'
        ) {
          const guestUid = currentUser.uid;
          const existingAccountCredential = await signInWithPopup(
            this.auth,
            provider,
          );

          await this.migrateGuestDataToExistingAccount(
            guestUid,
            existingAccountCredential.user.uid,
          );

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

  private async migrateGuestDataToExistingAccount(
    guestUid: string,
    targetUid: string,
  ): Promise<void> {
    if (!guestUid || !targetUid || guestUid === targetUid) {
      return;
    }

    await Promise.all([
      this.migratePlayers(guestUid, targetUid),
      this.migrateExcludedQuestions(guestUid, targetUid),
      this.migrateRooms(guestUid, targetUid),
    ]);
  }

  private async migratePlayers(
    guestUid: string,
    targetUid: string,
  ): Promise<void> {
    const playersCollection = collection(this.firestore, 'players');
    const [guestSnap, targetSnap] = await Promise.all([
      getDocs(query(playersCollection, where('userId', '==', guestUid))),
      getDocs(query(playersCollection, where('userId', '==', targetUid))),
    ]);

    if (guestSnap.empty) {
      return;
    }

    const guestDoc = guestSnap.docs[0];
    const guestPlayer = guestDoc.data() as Player;

    if (targetSnap.empty) {
      await updateDoc(doc(this.firestore, `players/${guestDoc.id}`), {
        userId: targetUid,
      });
      return;
    }

    const targetDoc = targetSnap.docs[0];
    const targetPlayer = targetDoc.data() as Player;
    const mergedStats = this.mergeStats(
      targetPlayer.stats ?? [],
      guestPlayer.stats ?? [],
    );

    await updateDoc(doc(this.firestore, `players/${targetDoc.id}`), {
      isAdmin: !!targetPlayer.isAdmin || !!guestPlayer.isAdmin,
      stats: mergedStats,
      finishDate: targetPlayer.finishDate ?? guestPlayer.finishDate ?? null,
    });

    await deleteDoc(doc(this.firestore, `players/${guestDoc.id}`));
  }

  private mergeStats(targetStats: Stat[], guestStats: Stat[]): Stat[] {
    const byGame = new Map<string, Stat>();

    targetStats.forEach((stat) => byGame.set(stat.gameName, { ...stat }));

    guestStats.forEach((guestStat) => {
      const existing = byGame.get(guestStat.gameName);
      if (!existing) {
        byGame.set(guestStat.gameName, { ...guestStat });
        return;
      }

      byGame.set(guestStat.gameName, {
        gameName: existing.gameName,
        medalsNumber: Math.max(
          existing.medalsNumber ?? 0,
          guestStat.medalsNumber ?? 0,
        ),
        lastSuccessRetrieved: Math.max(
          existing.lastSuccessRetrieved ?? 0,
          guestStat.lastSuccessRetrieved ?? 0,
        ),
      });
    });

    return Array.from(byGame.values());
  }

  private async migrateExcludedQuestions(
    guestUid: string,
    targetUid: string,
  ): Promise<void> {
    const excludedCollection = collection(this.firestore, 'excluded-questions');
    const [guestSnap, targetSnap] = await Promise.all([
      getDocs(query(excludedCollection, where('userId', '==', guestUid))),
      getDocs(query(excludedCollection, where('userId', '==', targetUid))),
    ]);

    if (guestSnap.empty) {
      return;
    }

    const guestDoc = guestSnap.docs[0];
    const guestData = guestDoc.data() as ExcludedUserQuestions;

    if (targetSnap.empty) {
      await updateDoc(
        doc(this.firestore, `excluded-questions/${guestDoc.id}`),
        {
          userId: targetUid,
        },
      );
      return;
    }

    const targetDoc = targetSnap.docs[0];
    const targetData = targetDoc.data() as ExcludedUserQuestions;

    const themesMap = new Map<number, string[]>();

    (targetData.themes ?? []).forEach((theme) => {
      themesMap.set(theme.categoryFilter, [...(theme.descriptions ?? [])]);
    });

    (guestData.themes ?? []).forEach((theme) => {
      const existing = themesMap.get(theme.categoryFilter) ?? [];
      const merged = Array.from(
        new Set([...(existing ?? []), ...(theme.descriptions ?? [])]),
      ).slice(-30);
      themesMap.set(theme.categoryFilter, merged);
    });

    const mergedThemes = Array.from(themesMap.entries()).map(
      ([categoryFilter, descriptions]) => ({
        categoryFilter,
        descriptions,
      }),
    );

    await updateDoc(doc(this.firestore, `excluded-questions/${targetDoc.id}`), {
      themes: mergedThemes,
    });

    await deleteDoc(doc(this.firestore, `excluded-questions/${guestDoc.id}`));
  }

  private async migrateRooms(
    guestUid: string,
    targetUid: string,
  ): Promise<void> {
    const roomsCollection = collection(this.firestore, 'rooms');
    const [ownedRoomsSnap, participantRoomsSnap] = await Promise.all([
      getDocs(query(roomsCollection, where('userId', '==', guestUid))),
      getDocs(
        query(roomsCollection, where('playerIds', 'array-contains', guestUid)),
      ),
    ]);

    const ownerUpdates = ownedRoomsSnap.docs.map((roomDoc) =>
      updateDoc(doc(this.firestore, `rooms/${roomDoc.id}`), {
        userId: targetUid,
      }),
    );

    const participantUpdates = participantRoomsSnap.docs.map(
      async (roomDoc) => {
        const roomData = roomDoc.data() as Room;
        const existingPlayerIds = roomData.playerIds ?? [];
        const replaced = existingPlayerIds.map((id) =>
          id === guestUid ? targetUid : id,
        );
        const deduped = Array.from(new Set(replaced));

        return updateDoc(doc(this.firestore, `rooms/${roomDoc.id}`), {
          playerIds: deduped,
        });
      },
    );

    await Promise.all([...ownerUpdates, ...participantUpdates]);
  }
}
