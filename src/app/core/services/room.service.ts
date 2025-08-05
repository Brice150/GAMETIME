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
import { countries } from 'src/assets/data/countries';
import { gameMap } from 'src/assets/data/games';
import { words } from 'src/assets/data/words';
import { Continent } from '../enums/continent.enum';
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

  newRoom(
    gameSelected: string,
    showFirstLetterMotus: boolean,
    showFirstLetterDrapeaux: boolean,
    stepsNumber: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
    continentFilter: number,
    playerId: string,
    isCreatedByAdmin: boolean
  ): Room {
    const showFirstLetter: boolean =
      gameSelected === this.motusGameKey
        ? showFirstLetterMotus
        : showFirstLetterDrapeaux;

    let countries: Country[] = [];
    let responses: string[] = [];

    this.generateResponses(
      gameSelected,
      stepsNumber,
      continentFilter,
      isWordLengthIncreasing,
      startWordLength,
      countries,
      responses
    );

    return {
      gameName: gameSelected,
      playerIds: !isCreatedByAdmin ? [playerId] : [],
      isStarted: false,
      showFirstLetter: showFirstLetter,
      stepsNumber: stepsNumber,
      continentFilter: continentFilter,
      isWordLengthIncreasing: isWordLengthIncreasing,
      startWordLength: startWordLength,
      responses: responses,
      countries: countries,
      startDate: null,
      startAgainNumber: 0,
      isCreatedByAdmin: isCreatedByAdmin,
    };
  }

  generateResponses(
    gameSelected: string,
    stepsNumber: number,
    continentFilter: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
    countries: Country[],
    responses: string[]
  ): void {
    if (gameSelected === this.drapeauxGameKey) {
      const generatedCountries = this.generateCountries(
        stepsNumber,
        continentFilter
      );
      countries.splice(0, countries.length, ...generatedCountries);
      responses.splice(
        0,
        responses.length,
        ...generatedCountries.map((country) => country.name)
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
    const countriesToGenerate: Country[] = [];
    const usedCountryNames = new Set<string>();

    const pool =
      continentFilter === Continent.Monde
        ? countries
        : countries.filter((c) => c.continent === continentFilter);

    let attempts = 0;
    while (countriesToGenerate.length < stepsNumber && attempts < 1000) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const candidate = pool[randomIndex];

      if (!usedCountryNames.has(candidate.name)) {
        usedCountryNames.add(candidate.name);
        countriesToGenerate.push(candidate);
      }

      attempts++;
    }

    return countriesToGenerate;
  }

  newCountry(continentFilter: number): Country {
    if (continentFilter === Continent.Monde) {
      const randomIndex = Math.floor(Math.random() * countries.length);
      return countries[randomIndex];
    } else {
      const filteredCountries = countries.filter(
        (country) => country.continent === continentFilter
      );

      const randomIndex = Math.floor(Math.random() * filteredCountries.length);
      return filteredCountries[randomIndex];
    }
  }
}
