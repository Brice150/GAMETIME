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
import { countries } from 'src/assets/data/countries';
import { gameMap } from 'src/assets/data/games';
import { words } from 'src/assets/data/words';
import { Continent } from '../enums/continent.enum';
import { Country } from '../interfaces/country';
import { Player } from '../interfaces/player';
import { PlayerRoom } from '../interfaces/player-room';
import { Room } from '../interfaces/room';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  roomsCollection = collection(this.firestore, 'rooms');
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;

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

  newRoom(
    gameSelected: string,
    modeSelected: string,
    showFirstLetterMotus: boolean,
    showFirstLetterDrapeaux: boolean,
    stepsNumber: number,
    isWordLengthIncreasing: boolean,
    startWordLength: number,
    continentFilter: number,
    player: Player
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

    const stat = player.stats.find((stat) => stat.gameName === gameSelected);

    const playerRoom: PlayerRoom = {
      userId: player.userId!,
      username: player.username,
      isOver: false,
      finishDate: null,
      medalsNumber: stat?.medalsNumer || 0,
      currentRoomWins: [],
    };

    return {
      gameName: gameSelected,
      playersRoom: [playerRoom],
      isStarted: modeSelected === 'solo',
      isSolo: modeSelected === 'solo',
      showFirstLetter: showFirstLetter,
      stepsNumber: stepsNumber,
      continentFilter: continentFilter,
      isWordLengthIncreasing: isWordLengthIncreasing,
      startWordLength: startWordLength,
      responses: responses,
      countries: countries,
      startDate: modeSelected === 'solo' ? new Date() : null,
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
    const wordsToGenerate: string[] = [];
    for (let i = 0; i < stepsNumber; i++) {
      if (!isWordLengthIncreasing) {
        wordsToGenerate.push(this.newWord(startWordLength));
      } else {
        wordsToGenerate.push(this.newWord(startWordLength + i));
      }
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
    for (let i = 0; i < stepsNumber; i++) {
      countriesToGenerate.push(this.newCountry(continentFilter));
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
