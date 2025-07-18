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
import { Player } from '../interfaces/player';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  playersCollection = collection(this.firestore, 'players');

  getPlayers(): Observable<Player[]> {
    const userId = this.userService.auth.currentUser?.uid;
    const playersCollection = query(
      collection(this.firestore, 'players'),
      where('userId', '==', userId)
    );
    return collectionData(playersCollection, { idField: 'id' }) as Observable<
      Player[]
    >;
  }

  getPlayer(playerId: string): Observable<Player> {
    const playerDoc = doc(this.firestore, `players/${playerId}`);
    return docData(playerDoc, { idField: 'id' }) as Observable<Player>;
  }

  addPlayer(player: Player): Observable<string> {
    const playerDoc = doc(this.playersCollection);
    player.id = playerDoc.id;
    player.userId = this.userService.auth.currentUser?.uid;
    return from(setDoc(playerDoc, { ...player })).pipe(map(() => player.id));
  }

  updatePlayer(player: Player): Observable<void> {
    if (!player.id) {
      return from(Promise.reject('ID de joueur manquant.'));
    }
    const playerDoc = doc(this.firestore, `players/${player.id}`);
    return from(updateDoc(playerDoc, { ...player }));
  }

  deletePlayer(playerId: string): Observable<void> {
    const playerDoc = doc(this.firestore, `players/${playerId}`);
    return from(deleteDoc(playerDoc));
  }

  deleteUserPlayer(): Observable<void> {
    const playersQuery = query(
      this.playersCollection,
      where('userId', '==', this.userService.auth.currentUser?.uid)
    );

    return collectionData(playersQuery, { idField: 'id' }).pipe(
      take(1),
      switchMap((players: any[]) => {
        if (players.length === 0) {
          return of(undefined);
        }

        const deleteRequests = players.map((player: Player) => {
          const playerDoc = doc(this.firestore, `players/${player.id}`);
          return deleteDoc(playerDoc);
        });

        return combineLatest(deleteRequests);
      }),
      map(() => undefined)
    );
  }
}
