import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { brands } from 'src/assets/data/brands';
import { countries } from 'src/assets/data/countries';
import { gameMap } from 'src/assets/data/games';
import { words } from 'src/assets/data/words';
import { BrandCategory } from '../enums/brand-category.enum';
import { Continent } from '../enums/continent.enum';
import { Brand } from '../interfaces/brand';
import { Country } from '../interfaces/country';
import { Room } from '../interfaces/room';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  roomsCollection = collection(this.firestore, 'rooms');
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  currentRoomSig = signal<Room | null | undefined>(undefined);

  readonly roomReady$ = toObservable(computed(() => this.currentRoomSig()));

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
    const roomsCollection = query(
      collection(this.firestore, 'rooms'),
      where('roomCode', '==', roomCode)
    );
    return collectionData(roomsCollection, { idField: 'id' }) as Observable<
      Room[]
    >;
  }

  addRoom(room: Room): Observable<string> {
    const roomDoc = doc(this.roomsCollection);
    room.id = roomDoc.id;
    room.userId = this.userService.auth.currentUser?.uid;
    return from(setDoc(roomDoc, { ...room })).pipe(map(() => room.id!));
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

  deleteUserRooms(): Observable<void> {
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

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateResponses(
    gameSelected: string,
    stepsNumber: number,
    categoryFilter: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
    countries: Country[],
    brands: Brand[],
    responses: string[]
  ): void {
    if (gameSelected === this.drapeauxGameKey) {
      const generatedCountries = this.generateCountries(
        stepsNumber,
        categoryFilter
      );
      countries.splice(0, countries.length, ...generatedCountries);
      responses.splice(
        0,
        responses.length,
        ...generatedCountries.map((country) => country.name)
      );
    } else if (gameSelected === this.marquesGameKey) {
      const generatedBrands = this.generateBrands(stepsNumber, categoryFilter);
      brands.splice(0, brands.length, ...generatedBrands);
      responses.splice(
        0,
        responses.length,
        ...generatedBrands.map((brand) => brand.name)
      );
    } else if (gameSelected === this.motusGameKey) {
      const generatedWords = this.generateMotusWords(
        stepsNumber,
        isWordLengthIncreasing,
        startWordLength
      );
      responses.splice(0, responses.length, ...generatedWords);
    }
  }

  generateMotusWords(
    stepsNumber: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number
  ): string[] {
    const wordsToGenerate: string[] = new Array();

    const usedWords = new Set<string>();

    let attempts = 0;
    while (wordsToGenerate.length < stepsNumber && attempts < 1000) {
      const length = isWordLengthIncreasing
        ? startWordLength + wordsToGenerate.length
        : startWordLength;

      const word = this.newWord(length);

      if (!usedWords.has(word)) {
        usedWords.add(word);
        wordsToGenerate.push(word);
      }

      attempts++;
    }

    return wordsToGenerate;
  }

  newWord(wordLength: number): string {
    const wordsFixedLength = words.filter((word) => word.length === wordLength);
    let randomIndex = Math.floor(Math.random() * wordsFixedLength.length);
    return wordsFixedLength[randomIndex];
  }

  generateCountries(stepsNumber: number, continentFilter: number): Country[] {
    return this.generateRandomItems(
      countries,
      stepsNumber,
      continentFilter === Continent.Monde ? null : continentFilter,
      (country, continent) => country.continent === continent,
      (country) => country.name
    );
  }

  generateBrands(stepsNumber: number, categoryFilter: number): Brand[] {
    return this.generateRandomItems(
      brands,
      stepsNumber,
      categoryFilter === BrandCategory.Tout ? null : categoryFilter,
      (brand, category) => brand.category === category,
      (brand) => brand.name
    );
  }

  generateRandomItems<T>(
    items: T[],
    stepsNumber: number,
    filterValue: any,
    filterFn: (item: T, filterValue: any) => boolean,
    getNameFn: (item: T) => string
  ): T[] {
    const generated: T[] = [];
    const usedNames = new Set<string>();

    const pool =
      filterValue === null
        ? items
        : items.filter((item) => filterFn(item, filterValue));

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
