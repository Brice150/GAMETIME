import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { Invitation } from '../interfaces/invitation';
import { Player } from '../interfaces/player';
import { Room } from '../interfaces/room';
import { UserService } from './user.service';

// Invitations de room entre amis. Le menage apres suppression d'une room est
// fait par la fonction `onRoomDeleted`, avec le SDK Admin : le client n'a
// acces qu'aux invitations dont il est l'expediteur ou le destinataire.
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
}
