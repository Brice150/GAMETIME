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
import { Player } from '../interfaces/player';
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

  // Firestore plafonne l'operateur "in" a 30 valeurs : au-dela il rejette la
  // requete, et une room de plus de 30 joueurs n'affichait plus personne.
  getPlayers(playerIds: string[]): Observable<Player[]> {
    if (!playerIds.length) {
      return of([]);
    }

    const streams = this.chunk(playerIds, 30).map(
      (chunk) =>
        collectionData(
          query(this.playersCollection, where('userId', 'in', chunk)),
          { idField: 'id' },
        ) as Observable<Player[]>,
    );

    return streams.length === 1
      ? streams[0]
      : combineLatest(streams).pipe(map((groups) => groups.flat()));
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
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

    return from(getDocs(playersQuery)).pipe(
      map((snapshot) => snapshot.docs.map((playerDoc) => playerDoc.data())),
      switchMap((players) => {
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

    for (let attempt = 2; attempt <= 10; attempt++) {
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

      candidate = `${base}${attempt}`;
    }

    return candidate;
  }

  private createPlayer(
    userId: string | undefined,
    email: string | null | undefined,
    username: string,
  ): Observable<string | null | undefined> {
    const animal = this.generateRandomAnimal();
    const playerDoc = doc(this.playersCollection);

    const player: Player = {
      id: playerDoc.id,
      userId: userId,
      username: username,
      animal: animal,
      // Aucun compteur au depart : `submitRound` cree celui d'un jeu a la
      // premiere medaille. Les regles peuvent ainsi exiger une liste vide, et
      // ajouter un jeu ne demande aucune reprise des fiches existantes.
      stats: [],
      isAdmin: false,
      currentRoomWins: [],
      finishDate: null,
      durationMs: null,
      isReady: false,
      friendIds: [],
      friendRequestIds: [],
      shareActivity: true,
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
  // Seuls les champs d'etat de partie sont ecrits. Renvoyer la fiche entiere
  // reecrivait aussi les medailles avec la copie locale de l'hote : une fiche
  // ayant evolue entre-temps etait ramenee en arriere, et les regles
  // refusaient alors tout le lot, donc le lancement.
  resetPlayersState(players: Player[]): Observable<void> {
    if (!players.length) {
      return of(undefined);
    }
    if (players.some((player) => !player.id)) {
      return from(Promise.reject('ID de joueur manquant.'));
    }

    const batch = writeBatch(this.firestore);
    players.forEach((player) => {
      batch.update(doc(this.firestore, `players/${player.id}`), {
        currentRoomWins: [],
        finishDate: null,
        durationMs: null,
        isReady: false,
        currentRoundProgress: null,
        vote: null,
      });
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

    return from(getDocs(playersQuery)).pipe(
      switchMap((snapshot) => {
        if (snapshot.empty) {
          return of(undefined);
        }

        const batch = writeBatch(this.firestore);
        snapshot.docs.forEach((playerDoc) => batch.delete(playerDoc.ref));

        return from(batch.commit());
      }),
      map(() => undefined),
    );
  }
}
