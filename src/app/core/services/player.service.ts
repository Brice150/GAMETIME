import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { animalsWithEmojis } from 'src/assets/data/animals';
import { gameMap } from 'src/assets/data/games';
import { Player } from '../interfaces/player';
import { Stat } from '../interfaces/stat';
import { UserService } from './user.service';

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

  getAllPlayers(): Observable<Player[]> {
    const playersCollection = query(collection(this.firestore, 'players'));
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
        const username = this.generateRandomUsername(email);
        const animal = this.generateRandomAnimal();
        const playerDoc = doc(this.playersCollection);

        const statMotus: Stat = {
          gameName: gameMap['motus'].key,
          medalsNumber: 0,
          lastSuccessRetrieved: 0,
        };
        const statDrapeaux: Stat = {
          gameName: gameMap['drapeaux'].key,
          medalsNumber: 0,
          lastSuccessRetrieved: 0,
        };
        const statMarques: Stat = {
          gameName: gameMap['marques'].key,
          medalsNumber: 0,
          lastSuccessRetrieved: 0,
        };
        const statQuiz: Stat = {
          gameName: gameMap['quiz'].key,
          medalsNumber: 0,
          lastSuccessRetrieved: 0,
        };

        const player: Player = {
          id: playerDoc.id,
          userId: userId,
          username: username,
          animal: animal,
          stats: [statMotus, statDrapeaux, statMarques, statQuiz],
          isAdmin: false,
          currentRoomWins: [],
          finishDate: null,
          isReady: false,
        };
        return from(setDoc(playerDoc, { ...player })).pipe(map(() => email));
      })
    );
  }

  generateRandomUsername(email?: string | null): string {
    const nameFromEmail = this.extractNameFromEmail(email);

    const formatName = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1);

    const generateFallback = () => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `User#${randomPart}`;
    };

    const finalName = nameFromEmail
      ? formatName(nameFromEmail)
      : generateFallback();

    return finalName;
  }

  generateRandomAnimal(): string {
    const animal =
      animalsWithEmojis[Math.floor(Math.random() * animalsWithEmojis.length)];

    return animal.emoji;
  }

  extractNameFromEmail(email?: string | null): string | null {
    if (!email || !email.includes('@')) return null;

    const prefix = email.split('@')[0];
    const base = prefix.includes('.') ? prefix.split('.')[0] : prefix;

    const cleaned = base.replace(/[^a-zA-Z0-9]/g, '');

    return cleaned;
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
    return forkJoin(updates$).pipe(map(() => undefined));
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
