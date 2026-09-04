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
import { gameMap, games } from '../../../assets/data/games';
import { GameRound } from '../interfaces/game';
import { Room } from '../interfaces/room';
import { ConnectionService } from './connection.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  connection = inject(ConnectionService);
  roomsCollection = collection(this.firestore, 'rooms');
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

  // Le code se lit a voix haute : ni O/0 ni I/1, qui se confondent.
  private readonly roomCodeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += this.roomCodeChars.charAt(
        Math.floor(Math.random() * this.roomCodeChars.length),
      );
    }
    return code;
  }

  // Deux rooms partageant un code, le joueur qui le saisit tombait dans l'une
  // ou l'autre au hasard. Apres quelques essais infructueux on garde le
  // dernier tirage : un doublon reste preferable a un blocage de creation.
  generateUniqueRoomCode(attemptsLeft = 5): Observable<string> {
    const code = this.generateRoomCode();

    if (attemptsLeft <= 1) {
      return of(code);
    }

    return this.getRoomsByCode(code).pipe(
      switchMap((rooms) =>
        rooms.length ? this.generateUniqueRoomCode(attemptsLeft - 1) : of(code),
      ),
    );
  }

  // Amorce le chargement du jeu de donnees pendant que les joueurs
  // attendent, pour qu'il ne pese plus sur le temps mort entre le lancement
  // et la premiere manche. Le jeu n'etant choisi qu'au lancement, une room
  // neuve precharge tout le catalogue.
  preloadGameData(gameName: string): void {
    if (!this.connection.shouldPreload()) {
      return;
    }

    const game = gameMap[gameName];

    for (const target of game ? [game] : games) {
      void target.load().catch(() => undefined);
    }
  }

  // Le tirage appartient au descripteur du jeu : ce service ne sait plus quels
  // jeux existent, il leur demande simplement une partie.
  drawRounds(room: Room): Promise<GameRound[]> {
    const game = gameMap[room.gameName];

    if (!game) {
      return Promise.resolve([]);
    }

    return game.draw({
      stepsNumber: room.stepsNumber,
      categoryFilter: room.categoryFilter,
      isWordLengthIncreasing: room.isWordLengthIncreasing,
      startWordLength: room.startWordLength,
    });
  }
}
