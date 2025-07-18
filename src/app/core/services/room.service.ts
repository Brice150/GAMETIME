import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { UserService } from './user.service';
import { Room } from '../interfaces/room';

@Injectable({ providedIn: 'root' })
export class RoomService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  roomsCollection = collection(this.firestore, 'rooms');

  getRooms(): Observable<Room[]> {
    const userId = this.userService.auth.currentUser?.uid;
    const roomsCollection = query(
      collection(this.firestore, 'rooms'),
      where('userId', '==', userId)
    );
    return collectionData(roomsCollection, { idField: 'id' }) as Observable<
      Room[]
    >;
  }

  addRoom(room: Room): Observable<string> {
    const roomDoc = doc(this.roomsCollection);
    room.id = roomDoc.id;
    room.userId = this.userService.auth.currentUser?.uid;
    return from(setDoc(roomDoc, { ...room })).pipe(map(() => room.id));
  }

  updateRoom(room: Room): Observable<void> {
    if (!room.id) {
      return from(Promise.reject('ID de salle manquant.'));
    }
    const roomDoc = doc(this.firestore, `rooms/${room.id}`);
    return from(updateDoc(roomDoc, { ...room }));
  }

  deleteRoom(roomId: string): Observable<void> {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return from(deleteDoc(roomDoc));
  }

  deleteUserRoom(): Observable<void> {
    const roomsQuery = query(
      this.roomsCollection,
      where('userId', '==', this.userService.auth.currentUser?.uid)
    );

    return collectionData(roomsQuery, { idField: 'id' }).pipe(
      take(1),
      switchMap((rooms: any[]) => {
        if (rooms.length === 0) {
          return of(undefined);
        }

        const deleteRequests = rooms.map((room: Room) => {
          const roomDoc = doc(this.firestore, `rooms/${room.id}`);
          return deleteDoc(roomDoc);
        });

        return combineLatest(deleteRequests);
      }),
      map(() => undefined)
    );
  }
}
