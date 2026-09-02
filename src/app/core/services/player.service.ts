import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import {
  combineLatest,
  filter,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';
import { animalsWithEmojis } from '../../../assets/data/animals';
import { gameMap } from '../../../assets/data/games';
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
  private allPlayers$?: Observable<Player[]>;

  readonly playerReady$ = toObservable(this.currentPlayerSig).pipe(
    filter((player): player is Player => !!player),
    take(1),
  );

  getPlayer(): Observable<Player[]> {
    const userId = this.userService.auth.currentUser?.uid;
    const playersCollection = query(
      collection(this.firestore, 'players'),
      where('userId', '==', userId),
    );
    return collectionData(playersCollection, { idField: 'id' }) as Observable<
      Player[]
    >;
  }

  getPlayers(playerIds: string[]): Observable<Player[]> {
    const playersCollection = query(
      collection(this.firestore, 'players'),
      where('userId', 'in', playerIds),
    );
    return collectionData(playersCollection, { idField: 'id' }) as Observable<
      Player[]
    >;
  }

  // Le classement, les amis, l'admin et la boite d'invitation lisent tous la
  // collection : une seule ecoute partagee au lieu de quatre.
  getAllPlayers(): Observable<Player[]> {
    this.allPlayers$ ??= (
      collectionData(query(this.playersCollection), {
        idField: 'id',
      }) as Observable<Player[]>
    ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.allPlayers$;
  }

  addPlayer(): Observable<string | null | undefined> {
    const userId = this.userService.auth.currentUser?.uid;
    const email = this.userService.auth.currentUser?.email;

    const playersQuery = query(
      this.playersCollection,
      where('userId', '==', userId),
    );

    return (
      collectionData(playersQuery, { idField: 'id' }) as Observable<Player[]>
    ).pipe(
      take(1),
      switchMap((players: Player[]) => {
        if (players.length > 0) {
          return of(void 0).pipe(map(() => email));
        }
        return from(this.buildUniqueUsername(email)).pipe(
          switchMap((username) => this.createPlayer(userId, email, username)),
        );
      }),
    );
  }

  // Le pseudo sert a se retrouver entre amis : deux comptes homonymes le
  // rendraient inexploitable.
  private async buildUniqueUsername(email?: string | null): Promise<string> {
    const base = this.generateRandomUsername(email);
    let candidate = base;

    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await getDocs(
        query(
          this.playersCollection,
          where('username', '==', candidate),
          limit(1),
        ),
      );

      if (existing.empty) {
        return candidate;
      }

      candidate = `${base}#${this.generateSuffix()}`;
    }

    return candidate;
  }

  private generateSuffix(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';

    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return suffix;
  }

  private createPlayer(
    userId: string | undefined,
    email: string | null | undefined,
    username: string,
  ): Observable<string | null | undefined> {
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

    const player: Player = {
      id: playerDoc.id,
      userId: userId,
      username: username,
      animal: animal,
      stats: [statMotus, statDrapeaux, statMarques],
      isAdmin: false,
      currentRoomWins: [],
      finishDate: null,
      durationMs: null,
      isReady: false,
      friendIds: [],
      friendRequestIds: [],
    };

    return from(setDoc(playerDoc, { ...player })).pipe(map(() => email));
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
    const { id, ...data } = player;
    const playerDoc = doc(this.firestore, `players/${id}`);
    return from(updateDoc(playerDoc, data));
  }

  updatePlayerFields(
    playerId: string | undefined,
    fields: Partial<Player>,
  ): Observable<void> {
    if (!playerId) {
      return from(Promise.reject('ID de joueur manquant.'));
    }
    const playerDoc = doc(this.firestore, `players/${playerId}`);
    return from(updateDoc(playerDoc, fields));
  }

  // Batch : la remise a zero de tous les joueurs doit etre atomique.
  updatePlayers(players: Player[]): Observable<void> {
    if (!players.length) {
      return of(undefined);
    }
    if (players.some((player) => !player.id)) {
      return from(Promise.reject('ID de joueur manquant.'));
    }

    const batch = writeBatch(this.firestore);
    players.forEach((player) => {
      const { id, ...data } = player;
      batch.update(doc(this.firestore, `players/${id}`), data);
    });

    return from(batch.commit());
  }

  deletePlayer(playerId: string): Observable<void> {
    const playerDoc = doc(this.firestore, `players/${playerId}`);
    return from(deleteDoc(playerDoc));
  }

  deleteUserPlayer(): Observable<void> {
    const playersQuery = query(
      this.playersCollection,
      where('userId', '==', this.userService.auth.currentUser?.uid),
    );

    const players$ = collectionData(playersQuery, {
      idField: 'id',
    }) as Observable<Player[]>;

    return players$.pipe(
      take(1),
      switchMap((players: Player[]) => {
        if (players.length === 0) {
          return of(undefined);
        }

        const deleteRequests = players.map((player: Player) => {
          const playerDoc = doc(this.firestore, `players/${player.id}`);
          return deleteDoc(playerDoc);
        });

        return combineLatest(deleteRequests);
      }),
      map(() => undefined),
    );
  }
}
