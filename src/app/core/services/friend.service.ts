import { inject, Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  doc,
  Firestore,
  writeBatch,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Player } from '../interfaces/player';
import { PlayerService } from './player.service';

@Injectable({ providedIn: 'root' })
export class FriendService {
  firestore = inject(Firestore);
  playerService = inject(PlayerService);

  private get currentPlayer(): Player | null {
    return this.playerService.currentPlayerSig() ?? null;
  }

  normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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

  // Une demande croisee vaut acceptation : inutile de faire valider deux fois.
  sendRequest(target: Player): Observable<void> {
    const me = this.currentPlayer;

    if (!me?.userId || !target.userId || target.userId === me.userId) {
      return from(Promise.reject('Joueur introuvable.'));
    }

    if (this.hasRequestFrom(target)) {
      return this.acceptRequest(target);
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `players/${target.id}`), {
      friendRequestIds: arrayUnion(me.userId),
    });

    return from(batch.commit());
  }

  cancelRequest(target: Player): Observable<void> {
    const me = this.currentPlayer;

    if (!me?.userId || !target.id) {
      return from(Promise.reject('Joueur introuvable.'));
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `players/${target.id}`), {
      friendRequestIds: arrayRemove(me.userId),
    });

    return from(batch.commit());
  }

  acceptRequest(requester: Player): Observable<void> {
    const me = this.currentPlayer;

    if (!me?.userId || !me.id || !requester.userId || !requester.id) {
      return from(Promise.reject('Joueur introuvable.'));
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `players/${me.id}`), {
      friendIds: arrayUnion(requester.userId),
      friendRequestIds: arrayRemove(requester.userId),
    });
    batch.update(doc(this.firestore, `players/${requester.id}`), {
      friendIds: arrayUnion(me.userId),
      friendRequestIds: arrayRemove(me.userId),
    });

    this.applyLocalAccept(requester.userId);

    return from(batch.commit());
  }

  declineRequest(requester: Player): Observable<void> {
    const me = this.currentPlayer;

    if (!me?.id || !requester.userId) {
      return from(Promise.reject('Joueur introuvable.'));
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `players/${me.id}`), {
      friendRequestIds: arrayRemove(requester.userId),
    });

    me.friendRequestIds = (me.friendRequestIds ?? []).filter(
      (id) => id !== requester.userId,
    );
    this.playerService.currentPlayerSig.set({ ...me });

    return from(batch.commit());
  }

  removeFriend(friend: Player): Observable<void> {
    const me = this.currentPlayer;

    if (!me?.userId || !me.id || !friend.userId || !friend.id) {
      return from(Promise.reject('Joueur introuvable.'));
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `players/${me.id}`), {
      friendIds: arrayRemove(friend.userId),
    });
    batch.update(doc(this.firestore, `players/${friend.id}`), {
      friendIds: arrayRemove(me.userId),
    });

    me.friendIds = (me.friendIds ?? []).filter((id) => id !== friend.userId);
    this.playerService.currentPlayerSig.set({ ...me });

    return from(batch.commit());
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
