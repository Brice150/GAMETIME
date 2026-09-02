import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, map, Observable } from 'rxjs';

export interface SubmitRoundResult {
  currentRoomWins: boolean[];
  finished: boolean;
  medalsNumber: number;
}

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
    won: boolean,
    durationMs: number | null,
  ): Observable<SubmitRoundResult> {
    const callable = httpsCallable<
      {
        roomId: string;
        stepIndex: number;
        won: boolean;
        durationMs: number | null;
      },
      SubmitRoundResult
    >(this.functions, 'submitRound');

    return from(callable({ roomId, stepIndex, won, durationMs })).pipe(
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

  linkGuestAccount(guestIdToken: string): Observable<{ migrated: boolean }> {
    const callable = httpsCallable<
      { guestIdToken: string },
      { migrated: boolean }
    >(this.functions, 'linkGuestAccount');

    return from(callable({ guestIdToken })).pipe(map((result) => result.data));
  }
}
