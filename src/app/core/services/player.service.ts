import { computed, inject, Injectable, signal } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  combineLatest,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { gameMap } from 'src/assets/data/games';
import { v4 as uuidv4 } from 'uuid';
import { Player } from '../interfaces/player';
import { Stat } from '../interfaces/stat';
import { UserService } from './user.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  playersCollection = collection(this.firestore, 'players');
  currentPlayerSig = signal<Player | null | undefined>(undefined);
  currentPlayersSig = signal<Player[]>([]);

  readonly playerReady$ = toObservable(
    computed(() => this.currentPlayerSig())
  ).pipe(
    filter((player): player is Player => !!player),
    take(1)
  );

  readonly playersReady$ = toObservable(
    computed(() => this.currentPlayersSig())
  );

  getPlayer(): Observable<Player[]> {
    const userId = this.userService.auth.currentUser?.uid;
    const playersCollection = query(
      collection(this.firestore, 'players'),
      where('userId', '==', userId)
    );
    return collectionData(playersCollection, { idField: 'id' }) as Observable<
      Player[]
    >;
  }

  getPlayers(playerIds: string[]): Observable<Player[]> {
    const playersCollection = query(
      collection(this.firestore, 'players'),
      where('userId', 'in', playerIds)
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

        const statMotus: Stat = {
          gameName: gameMap['motus'].key,
          medalsNumer: 0,
        };
        const statDrapeaux: Stat = {
          gameName: gameMap['drapeaux'].key,
          medalsNumer: 0,
        };

        const player: Player = {
          id: playerDoc.id,
          userId: userId,
          username: username,
          stats: [statMotus, statDrapeaux],
          isAdmin: false,
          isOver: false,
          currentRoomWins: [],
          finishDate: null,
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

  updatePlayers(players: Player[]): Observable<void> {
    const updates$ = players.map((player) => this.updatePlayer(player));

    return combineLatest(updates$).pipe(map(() => void 0));
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
