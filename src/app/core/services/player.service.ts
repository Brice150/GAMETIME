import { inject, Injectable, signal } from '@angular/core';
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
import { v4 as uuidv4 } from 'uuid';
import { Games } from '../enums/games.enum';
import { Stat } from '../interfaces/stat';

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

  addPlayer(): Observable<string | null | undefined> {
    const userId = this.userService.auth.currentUser?.uid;
    const email = this.userService.auth.currentUser?.email;

    const playersQuery = query(
      this.playersCollection,
      where('userId', '==', userId)
    );

    return (
      collectionData(playersQuery, { idField: 'id' }) as Observable<Player[]>
    ).pipe(
      take(1),
      switchMap((players: Player[]) => {
        if (players.length > 0) {
          return of(void 0).pipe(map(() => email));
        }
        const username = `User#${this.generateUsernameSuffix()}`;
        const playerDoc = doc(this.playersCollection);

        const statMotus: Stat = { gameName: Games.MOTUS, medalsNumer: 0 };
        const statFlag: Stat = { gameName: Games.FLAG, medalsNumer: 0 };

        const player: Player = {
          id: playerDoc.id,
          userId: userId,
          username: username,
          stats: [statMotus, statFlag],
        };
        return from(setDoc(playerDoc, { ...player })).pipe(map(() => email));
      })
    );
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

  generateUsernameSuffix(): string {
    const uuid = uuidv4();
    return uuid.replace(/-/g, '').slice(-4);
  }
}
