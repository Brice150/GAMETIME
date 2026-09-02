import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { Invitation } from '../interfaces/invitation';
import { Player } from '../interfaces/player';
import { Room } from '../interfaces/room';
import { UserService } from './user.service';

// Invitations de room entre amis. Pas de push navigateur ici : la
// notification est temps reel dans l'application, via l'ecoute Firestore.
@Injectable({ providedIn: 'root' })
export class InvitationService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  invitationsCollection = collection(this.firestore, 'invitations');

  // Un seul document par couple (room, destinataire) : reinviter ne cree pas
  // de doublon.
  private buildId(roomId: string, toUserId: string): string {
    return `${roomId}_${toUserId}`;
  }

  getMyInvitations(): Observable<Invitation[]> {
    const userId = this.userService.auth.currentUser?.uid;

    if (!userId) {
      return of([]);
    }

    const invitationsQuery = query(
      this.invitationsCollection,
      where('toUserId', '==', userId),
    );

    return collectionData(invitationsQuery, {
      idField: 'id',
    }) as Observable<Invitation[]>;
  }

  sendInvitation(
    room: Room,
    sender: Player,
    toUserId: string,
  ): Observable<void> {
    if (!room.id || !sender.userId) {
      return from(Promise.reject('Room introuvable.'));
    }

    const invitation: Invitation = {
      roomId: room.id,
      roomCode: room.roomCode,
      fromUserId: sender.userId,
      fromUsername: sender.username,
      fromAnimal: sender.animal,
      toUserId: toUserId,
      createdAt: new Date(),
    };

    const invitationDoc = doc(
      this.firestore,
      `invitations/${this.buildId(room.id, toUserId)}`,
    );

    return from(setDoc(invitationDoc, { ...invitation }));
  }

  deleteInvitation(invitationId: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, `invitations/${invitationId}`)));
  }

  // Une room supprimee laisserait des invitations mortes.
  deleteInvitationsForRoom(roomId: string | undefined): Observable<void> {
    if (!roomId) {
      return of(undefined);
    }

    const invitationsQuery = query(
      this.invitationsCollection,
      where('roomId', '==', roomId),
    );

    return from(getDocs(invitationsQuery)).pipe(
      switchMap((snapshot) => {
        if (snapshot.empty) {
          return of(undefined);
        }

        const batch = writeBatch(this.firestore);
        snapshot.docs.forEach((invitationDoc) =>
          batch.delete(invitationDoc.ref),
        );
        return from(batch.commit());
      }),
      map(() => undefined),
    );
  }
}
