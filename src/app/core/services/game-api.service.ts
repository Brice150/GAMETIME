import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, map, Observable } from 'rxjs';

export interface SubmitRoundResult {
  // Verdict du serveur : c'est lui qui compare la reponse au mot de la manche.
  won: boolean;
  currentRoomWins: boolean[];
  finished: boolean;
  medalsNumber: number;
}

export type FriendAction = 'send' | 'cancel' | 'accept' | 'decline' | 'remove';

export interface ClaimGoalResult {
  reward: number;
  medalsNumber: number;
}

// Les medailles ne sont plus ecrites par le client : les regles Firestore
// interdisent l'ecriture de `stats`, seules ces fonctions les attribuent
// apres verification.
@Injectable({ providedIn: 'root' })
export class GameApiService {
  functions = inject(Functions);

  submitRound(
    roomId: string,
    stepIndex: number,
    answer: string,
    durationMs: number | null,
  ): Observable<SubmitRoundResult> {
    const callable = httpsCallable<
      {
        roomId: string;
        stepIndex: number;
        answer: string;
        durationMs: number | null;
      },
      SubmitRoundResult
    >(this.functions, 'submitRound');

    return from(callable({ roomId, stepIndex, answer, durationMs })).pipe(
      map((result) => result.data),
    );
  }

  claimGoal(gameName: string, target: number): Observable<ClaimGoalResult> {
    const callable = httpsCallable<
      { gameName: string; target: number },
      ClaimGoalResult
    >(this.functions, 'claimGoal');

    return from(callable({ gameName, target })).pipe(
      map((result) => result.data),
    );
  }

  manageFriendship(
    action: FriendAction,
    targetUserId: string,
  ): Observable<void> {
    const callable = httpsCallable<
      { action: FriendAction; targetUserId: string },
      { ok: boolean }
    >(this.functions, 'manageFriendship');

    return from(callable({ action, targetUserId })).pipe(map(() => undefined));
  }

  linkGuestAccount(guestIdToken: string): Observable<{ migrated: boolean }> {
    const callable = httpsCallable<
      { guestIdToken: string },
      { migrated: boolean }
    >(this.functions, 'linkGuestAccount');

    return from(callable({ guestIdToken })).pipe(map((result) => result.data));
  }
}
