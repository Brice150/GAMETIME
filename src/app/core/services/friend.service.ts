import { inject, Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { Player } from '../interfaces/player';
import { normalizeUsername } from '../utils/username.util';
import { FriendAction, GameApiService } from './game-api.service';
import { PlayerService } from './player.service';

// Les amities sont ecrites par la fonction `manageFriendship` : le client ne
// peut plus toucher aux listes d'amis, ni aux siennes ni a celles des autres.
@Injectable({ providedIn: 'root' })
export class FriendService {
  playerService = inject(PlayerService);
  gameApi = inject(GameApiService);

  private get currentPlayer(): Player | null {
    return this.playerService.currentPlayerSig() ?? null;
  }

  normalizeText(value: string): string {
    return normalizeUsername(value);
  }

  isFriend(player: Player): boolean {
    const userId = this.currentPlayer?.userId;
    return (
      !!userId &&
      !!player.userId &&
      (this.currentPlayer?.friendIds ?? []).includes(player.userId)
    );
  }

  // Demande que j'ai envoyee : elle est stockee chez le destinataire.
  hasSentRequestTo(player: Player): boolean {
    const userId = this.currentPlayer?.userId;
    return !!userId && (player.friendRequestIds ?? []).includes(userId);
  }

  hasRequestFrom(player: Player): boolean {
    return (
      !!player.userId &&
      (this.currentPlayer?.friendRequestIds ?? []).includes(player.userId)
    );
  }

  // Une demande croisee vaut acceptation : le serveur applique la meme regle.
  sendRequest(target: Player): Observable<void> {
    const wasMutual = this.hasRequestFrom(target);

    return this.call('send', target).pipe(
      tap(() => {
        if (wasMutual && target.userId) {
          this.applyLocalAccept(target.userId);
        }
      }),
    );
  }

  cancelRequest(target: Player): Observable<void> {
    return this.call('cancel', target);
  }

  acceptRequest(requester: Player): Observable<void> {
    return this.call('accept', requester).pipe(
      tap(() => {
        if (requester.userId) {
          this.applyLocalAccept(requester.userId);
        }
      }),
    );
  }

  declineRequest(requester: Player): Observable<void> {
    return this.call('decline', requester).pipe(
      tap(() => {
        const me = this.currentPlayer;

        if (!me) {
          return;
        }

        me.friendRequestIds = (me.friendRequestIds ?? []).filter(
          (id) => id !== requester.userId,
        );
        this.playerService.currentPlayerSig.set({ ...me });
      }),
    );
  }

  removeFriend(friend: Player): Observable<void> {
    return this.call('remove', friend).pipe(
      tap(() => {
        const me = this.currentPlayer;

        if (!me) {
          return;
        }

        me.friendIds = (me.friendIds ?? []).filter(
          (id) => id !== friend.userId,
        );
        this.playerService.currentPlayerSig.set({ ...me });
      }),
    );
  }

  private call(action: FriendAction, target: Player): Observable<void> {
    if (!target.userId) {
      return throwError(() => new Error('Joueur introuvable.'));
    }

    return this.gameApi.manageFriendship(action, target.userId);
  }

  private applyLocalAccept(requesterUserId: string): void {
    const me = this.currentPlayer;

    if (!me) {
      return;
    }

    me.friendIds = Array.from(
      new Set([...(me.friendIds ?? []), requesterUserId]),
    );
    me.friendRequestIds = (me.friendRequestIds ?? []).filter(
      (id) => id !== requesterUserId,
    );
    this.playerService.currentPlayerSig.set({ ...me });
  }
}
