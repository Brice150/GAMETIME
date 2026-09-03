import { inject, Injectable, signal } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs';
import { gameMap } from '../../../assets/data/games';
import { BrandCategory } from '../enums/brand-category.enum';
import { Continent } from '../enums/continent.enum';
import { Brand } from '../interfaces/brand';
import { Country } from '../interfaces/country';
import { Room } from '../interfaces/room';
import { ConnectionService } from './connection.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  connection = inject(ConnectionService);
  roomsCollection = collection(this.firestore, 'rooms');
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  currentRoomSig = signal<Room | null | undefined>(undefined);

  getRooms(): Observable<Room[]> {
    const roomsCollection = collection(this.firestore, 'rooms');
    return collectionData(roomsCollection, { idField: 'id' }) as Observable<
      Room[]
    >;
  }

  getRoom(roomId: string): Observable<Room> {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return docData(roomDoc, { idField: 'id' }) as Observable<Room>;
  }

  getRoomsByCode(roomCode: string): Observable<Room[]> {
    const roomsQuery = query(
      this.roomsCollection,
      where('roomCode', '==', roomCode),
    );

    return from(getDocs(roomsQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (roomDoc) => ({ ...roomDoc.data(), id: roomDoc.id }) as Room,
        ),
      ),
    );
  }

  // Rooms ou se trouve au moins un des joueurs donnes. `array-contains-any`
  // plafonne a 30 valeurs, d'ou le decoupage.
  getRoomsForPlayers(userIds: string[]): Observable<Room[]> {
    if (!userIds.length) {
      return of([]);
    }

    const streams = this.chunk(userIds, 30).map(
      (chunk) =>
        collectionData(
          query(
            this.roomsCollection,
            where('playerIds', 'array-contains-any', chunk),
          ),
          { idField: 'id' },
        ) as Observable<Room[]>,
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

  addRoom(room: Room): Observable<string> {
    const roomDoc = doc(this.roomsCollection);
    room.id = roomDoc.id;
    room.userId = this.userService.auth.currentUser?.uid;
    room.createdAt = new Date();
    room.lastActivityAt = room.createdAt;
    return from(setDoc(roomDoc, { ...room })).pipe(map(() => room.id!));
  }

  updateRoom(room: Room): Observable<void> {
    if (!room.id) {
      return from(Promise.reject('ID de salle manquant.'));
    }
    const { id, ...data } = room;
    const roomDoc = doc(this.firestore, `rooms/${id}`);
    return from(updateDoc(roomDoc, data));
  }

  // Le document room embarque `responses`, `countries` et `brands` : eviter
  // de tout reecrire pour un seul champ.
  updateRoomFields(
    roomId: string | undefined,
    fields: Partial<Room>,
  ): Observable<void> {
    if (!roomId) {
      return from(Promise.reject('ID de salle manquant.'));
    }
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return from(updateDoc(roomDoc, fields));
  }

  // Entrer et sortir se font par operation atomique : reecrire le tableau
  // entier faisait disparaitre un joueur quand deux rejoignaient en meme temps.
  addPlayerToRoom(
    roomId: string | undefined,
    userId: string,
  ): Observable<void> {
    if (!roomId) {
      return from(Promise.reject('ID de salle manquant.'));
    }
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return from(updateDoc(roomDoc, { playerIds: arrayUnion(userId) }));
  }

  removePlayerFromRoom(
    roomId: string | undefined,
    userId: string,
  ): Observable<void> {
    if (!roomId) {
      return from(Promise.reject('ID de salle manquant.'));
    }
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return from(updateDoc(roomDoc, { playerIds: arrayRemove(userId) }));
  }

  deleteRoom(roomId: string): Observable<void> {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    return from(deleteDoc(roomDoc));
  }

  // Sans « Quitter » explicite, un joueur restait listé dans toutes les rooms
  // qu'il avait traversées : il y apparaissait comme participant fantôme.
  leaveOtherRooms(keptRoomId: string | undefined): Observable<void> {
    const userId = this.userService.auth.currentUser?.uid;

    if (!userId) {
      return of(undefined);
    }

    const roomsQuery = query(
      this.roomsCollection,
      where('playerIds', 'array-contains', userId),
    );

    return from(getDocs(roomsQuery)).pipe(
      switchMap((snapshot) => {
        const staleRooms = snapshot.docs.filter(
          (roomDoc) => roomDoc.id !== keptRoomId,
        );

        if (!staleRooms.length) {
          return of(undefined);
        }

        const batch = writeBatch(this.firestore);
        staleRooms.forEach((roomDoc) =>
          batch.update(roomDoc.ref, { playerIds: arrayRemove(userId) }),
        );

        return from(batch.commit());
      }),
      map(() => undefined),
    );
  }

  // Une room abandonnee (onglet ferme) n'est supprimee par personne : on la
  // reconnait a sa derniere activite.
  isStale(room: Room, maxAgeMs: number): boolean {
    const reference = this.toDate(room.lastActivityAt ?? room.createdAt);

    if (!reference) {
      return false;
    }

    return Date.now() - reference.getTime() > maxAgeMs;
  }

  private toDate(value: Date | Timestamp | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return value instanceof Date ? value : null;
  }

  deleteUserRooms(): Observable<void> {
    const roomsQuery = query(
      this.roomsCollection,
      where('userId', '==', this.userService.auth.currentUser?.uid),
    );

    return from(getDocs(roomsQuery)).pipe(
      switchMap((snapshot) => {
        if (snapshot.empty) {
          return of(undefined);
        }

        const batch = writeBatch(this.firestore);
        snapshot.docs.forEach((roomDoc) => batch.delete(roomDoc.ref));

        return from(batch.commit());
      }),
      map(() => undefined),
    );
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Les jeux de donnees (mots, pays, marques) pesent ~310 Ko de source et ne
  // servent qu'a la generation d'une partie : on les charge a la demande
  // plutot que de les embarquer dans le bundle initial.
  private wordsByLength?: Map<number, string[]>;
  private countriesData?: Country[];
  private brandsData?: Brand[];

  // Amorce le chargement pendant l'attente, pour qu'il ne pese plus sur le
  // temps mort entre le lancement et la premiere manche.
  preloadGameData(gameName: string): void {
    if (!this.connection.shouldPreload()) {
      return;
    }

    if (gameName === this.motusGameKey) {
      void this.loadWordsByLength().catch(() => undefined);
    } else if (gameName === this.drapeauxGameKey) {
      void this.loadCountries().catch(() => undefined);
    } else if (gameName === this.marquesGameKey) {
      void this.loadBrands().catch(() => undefined);
    } else {
      // Room neuve : le jeu n'est pas encore choisi.
      void this.loadWordsByLength().catch(() => undefined);
      void this.loadCountries().catch(() => undefined);
      void this.loadBrands().catch(() => undefined);
    }
  }

  // Indexe une fois par longueur : `newWord` refiltrait les 19 000 mots a
  // chaque tirage.
  private async loadWordsByLength(): Promise<Map<number, string[]>> {
    if (!this.wordsByLength) {
      const { words } = await import('../../../assets/data/words');
      const byLength = new Map<number, string[]>();

      for (const word of words) {
        const pool = byLength.get(word.length);
        if (pool) {
          pool.push(word);
        } else {
          byLength.set(word.length, [word]);
        }
      }

      this.wordsByLength = byLength;
    }

    return this.wordsByLength;
  }

  private async loadCountries(): Promise<Country[]> {
    this.countriesData ??= (
      await import('../../../assets/data/countries')
    ).countries;
    return this.countriesData;
  }

  private async loadBrands(): Promise<Brand[]> {
    this.brandsData ??= (await import('../../../assets/data/brands')).brands;
    return this.brandsData;
  }

  async generateResponses(
    gameSelected: string,
    stepsNumber: number,
    categoryFilter: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
    countries: Country[],
    brands: Brand[],
    responses: string[],
  ): Promise<void> {
    if (gameSelected === this.drapeauxGameKey) {
      const generatedCountries = await this.generateCountries(
        stepsNumber,
        categoryFilter,
      );
      countries.splice(0, countries.length, ...generatedCountries);
      responses.splice(
        0,
        responses.length,
        ...generatedCountries.map((country) => country.name),
      );
    } else if (gameSelected === this.marquesGameKey) {
      const generatedBrands = await this.generateBrands(
        stepsNumber,
        categoryFilter,
      );
      brands.splice(0, brands.length, ...generatedBrands);
      responses.splice(
        0,
        responses.length,
        ...generatedBrands.map((brand) => brand.name),
      );
    } else if (gameSelected === this.motusGameKey) {
      const generatedWords = await this.generateMotusWords(
        stepsNumber,
        isWordLengthIncreasing,
        startWordLength,
      );
      responses.splice(0, responses.length, ...generatedWords);
    }
  }

  async generateMotusWords(
    stepsNumber: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
  ): Promise<string[]> {
    const wordsByLength = await this.loadWordsByLength();
    const wordsToGenerate: string[] = [];

    const usedWords = new Set<string>();

    let attempts = 0;
    while (wordsToGenerate.length < stepsNumber && attempts < 1000) {
      const length = isWordLengthIncreasing
        ? startWordLength + wordsToGenerate.length
        : startWordLength;

      const pool = wordsByLength.get(length) ?? this.longestPool(wordsByLength);

      // Repli sur la plus grande longueur disponible : sortir de la boucle
      // rendait une partie plus courte que celle demandee.
      if (!pool?.length) {
        break;
      }

      const word = pool[Math.floor(Math.random() * pool.length)];

      if (!usedWords.has(word)) {
        usedWords.add(word);
        wordsToGenerate.push(word);
      }

      attempts++;
    }

    return wordsToGenerate;
  }

  private longestPool(
    wordsByLength: Map<number, string[]>,
  ): string[] | undefined {
    const longest = Math.max(...wordsByLength.keys());
    return wordsByLength.get(longest);
  }

  async generateCountries(
    stepsNumber: number,
    continentFilter: number,
  ): Promise<Country[]> {
    return this.generateRandomItems(
      await this.loadCountries(),
      stepsNumber,
      continentFilter === Continent.Monde ? null : continentFilter,
      (country, continent) => country.continent === continent,
      (country) => country.name,
    );
  }

  async generateBrands(
    stepsNumber: number,
    categoryFilter: number,
  ): Promise<Brand[]> {
    return this.generateRandomItems(
      await this.loadBrands(),
      stepsNumber,
      categoryFilter === BrandCategory.Tout ? null : categoryFilter,
      (brand, category) => brand.category === category,
      (brand) => brand.name,
    );
  }

  generateRandomItems<T, U>(
    items: T[],
    stepsNumber: number,
    filterValue: U | null,
    filterFn: (item: T, filterValue: U) => boolean,
    getNameFn: (item: T) => string,
  ): T[] {
    const generated: T[] = [];
    const usedNames = new Set<string>();

    const pool =
      filterValue === null
        ? items
        : items.filter((item) => filterFn(item, filterValue));

    if (!pool.length) {
      return generated;
    }

    let attempts = 0;
    while (generated.length < stepsNumber && attempts < 1000) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const candidate = pool[randomIndex];

      if (!usedNames.has(getNameFn(candidate))) {
        usedNames.add(getNameFn(candidate));
        generated.push(candidate);
      }

      attempts++;
    }

    return generated;
  }
}
