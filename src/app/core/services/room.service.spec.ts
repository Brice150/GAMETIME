import { TestBed } from '@angular/core/testing';
import { Firestore, Timestamp } from '@angular/fire/firestore';
// Le constructeur reel prend des secondes : celui de la doublure prend une date. Le service teste
// `instanceof`, donc l'objet doit bien venir de la classe montee par la fabrique.
const FakeTimestamp = Timestamp as unknown as new (date: Date) => Timestamp;
import { firstValueFrom, of } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Room } from '../interfaces/room';
import { buildRoom } from '../../../testing/test-providers';
import { ConnectionService } from './connection.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';

interface Clause {
  field: string;
  op: string;
  value: unknown;
}

// Le SDK Firestore est appele par fonctions libres : on le remplace au niveau du module. Une
// requete est reduite aux clauses qu'elle porte, ce qui suffit a verifier ce que le service demande.
interface DocRef {
  path: string;
  id: string;
}

const setDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const updateDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const deleteDoc = vi.fn((path: string) => Promise.resolve(path));
const commit = vi.fn(() => Promise.resolve());
const batchUpdate = vi.fn((ref: string, data: Record<string, unknown>) => ({
  ref,
  data,
}));
const batchDelete = vi.fn((ref: string) => ref);
let queries: Clause[][] = [];
let snapshots: {
  empty: boolean;
  docs: { id: string; ref: string; data: () => unknown }[];
}[] = [];
let streams: Room[][] = [];

vi.mock('@angular/fire/firestore', () => {
  // Declaree dans la fabrique : `vi.mock` est hisse au-dessus des declarations du fichier, et une
  // classe definie plus bas serait encore dans sa zone morte au moment ou le module est monte.
  class Timestamp {
    constructor(private readonly date: Date) {}
    toDate(): Date {
      return this.date;
    }
  }

  return {
    Firestore: class {},
    Timestamp,
    collection: (_firestore: unknown, path: string) => ({ path, clauses: [] }),
    // Firestore rend une reference, dont le service lit l'identifiant a la creation.
    doc: (_target: unknown, path?: string): DocRef =>
      typeof path === 'string'
        ? { path, id: path.split('/').pop()! }
        : { path: 'rooms/genere', id: 'genere' },
    docData: () => of(streams.shift()?.[0] ?? null),
    query: (source: { clauses?: Clause[] }, ...clauses: Clause[]) => {
      const merged = [...(source.clauses ?? []), ...clauses.filter(Boolean)];
      queries.push(merged);
      return { ...source, clauses: merged };
    },
    where: (field: string, op: string, value: unknown) => ({
      field,
      op,
      value,
    }),
    arrayUnion: (value: unknown) => ({ union: value }),
    arrayRemove: (value: unknown) => ({ remove: value }),
    setDoc: (ref: DocRef, data: Record<string, unknown>) =>
      setDoc(ref.path, data),
    updateDoc: (ref: DocRef, data: Record<string, unknown>) =>
      updateDoc(ref.path, data),
    deleteDoc: (ref: DocRef) => deleteDoc(ref.path),
    getDocs: () =>
      Promise.resolve(snapshots.shift() ?? { docs: [], empty: true }),
    collectionData: () => of(streams.shift() ?? []),
    writeBatch: () => ({ update: batchUpdate, delete: batchDelete, commit }),
  };
});

describe('RoomService', () => {
  let service: RoomService;
  let currentUser: { uid: string } | null;
  let shouldPreload: Mock<() => boolean>;

  /** Les clauses portees par la derniere requete construite. */
  function lastClauses(): Clause[] {
    return queries[queries.length - 1];
  }

  /** Un instantane Firestore qui rend les salles donnees. */
  function snapshot(rooms: Room[]) {
    return {
      empty: rooms.length === 0,
      docs: rooms.map((room) => ({
        id: room.id!,
        ref: `rooms/${room.id}`,
        data: () => room,
      })),
    };
  }

  function build(): RoomService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
        { provide: ConnectionService, useValue: { shouldPreload } },
        {
          provide: UserService,
          useValue: {
            auth: {
              get currentUser() {
                return currentUser;
              },
            },
          },
        },
      ],
    });
    return TestBed.inject(RoomService);
  }

  beforeEach(() => {
    setDoc.mockClear();
    updateDoc.mockClear();
    deleteDoc.mockClear();
    commit.mockClear();
    batchUpdate.mockClear();
    batchDelete.mockClear();
    queries = [];
    snapshots = [];
    streams = [];
    currentUser = { uid: 'u1' };
    shouldPreload = vi.fn(() => true);
    service = build();
  });

  afterEach(() => vi.useRealTimers());

  describe('lecture', () => {
    it('rend toutes les salles', async () => {
      streams = [[buildRoom()]];

      await expect(firstValueFrom(service.getRooms())).resolves.toHaveLength(1);
    });

    it('rend une salle par son identifiant', async () => {
      streams = [[buildRoom({ id: 'r1' })]];

      const room = await firstValueFrom(service.getRoom('r1'));

      expect(room.id).toBe('r1');
    });

    it('cherche une salle par son code', async () => {
      snapshots = [snapshot([buildRoom({ id: 'r1' })])];

      const rooms = await firstValueFrom(service.getRoomsByCode('ABCD'));

      expect(lastClauses()).toContainEqual({
        field: 'roomCode',
        op: '==',
        value: 'ABCD',
      });
      expect(rooms[0].id).toBe('r1');
    });

    it('ne demande rien pour une liste de joueurs vide', async () => {
      await expect(
        firstValueFrom(service.getRoomsForPlayers([])),
      ).resolves.toEqual([]);
      expect(queries).toEqual([]);
    });

    it('demande une seule requete sous le plafond de trente', async () => {
      streams = [[buildRoom()]];

      await firstValueFrom(service.getRoomsForPlayers(['u1', 'u2']));

      expect(queries).toHaveLength(1);
      expect(lastClauses()).toContainEqual({
        field: 'playerIds',
        op: 'array-contains-any',
        value: ['u1', 'u2'],
      });
    });

    it('decoupe au-dela du plafond de trente que Firestore impose', async () => {
      const ids = Array.from({ length: 31 }, (_, index) => `u${index}`);
      streams = [[buildRoom({ id: 'a' })], [buildRoom({ id: 'b' })]];

      const rooms = await firstValueFrom(service.getRoomsForPlayers(ids));

      expect(queries).toHaveLength(2);
      expect(rooms.map((room) => room.id)).toEqual(['a', 'b']);
    });
  });

  describe('ecriture', () => {
    it('cree une salle au nom du compte connecte, horodatee', async () => {
      const id = await firstValueFrom(service.addRoom(buildRoom()));

      expect(id).toBe('genere');
      const created = setDoc.mock.lastCall![1] as Partial<Room>;
      expect(created.userId).toBe('u1');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.lastActivityAt).toBe(created.createdAt);
    });

    it('met a jour une salle sans reecrire son identifiant', async () => {
      await firstValueFrom(service.updateRoom(buildRoom({ id: 'r1' })));

      expect(updateDoc.mock.lastCall![0]).toBe('rooms/r1');
      expect(updateDoc.mock.lastCall![1]).not.toHaveProperty('id');
    });

    it('refuse de mettre a jour une salle sans identifiant', async () => {
      const room = { ...buildRoom(), id: undefined } as unknown as Room;

      const failure = await new Promise((resolve) =>
        service.updateRoom(room).subscribe({ error: resolve }),
      );

      expect(failure).toBe('ID de salle manquant.');
    });

    it('ecrit les seuls champs demandes', async () => {
      await firstValueFrom(service.updateRoomFields('r1', { isStarted: true }));

      expect(updateDoc).toHaveBeenCalledWith('rooms/r1', { isStarted: true });
    });

    it('refuse d ecrire des champs sans identifiant', async () => {
      const failure = await new Promise((resolve) =>
        service
          .updateRoomFields(undefined, { isStarted: true })
          .subscribe({ error: resolve }),
      );

      expect(failure).toBe('ID de salle manquant.');
    });

    it('supprime une salle par son identifiant', async () => {
      await firstValueFrom(service.deleteRoom('r1'));

      expect(deleteDoc).toHaveBeenCalledWith('rooms/r1');
    });
  });

  describe('entrees et sorties', () => {
    it('ajoute un joueur sans reecrire le tableau entier', async () => {
      await firstValueFrom(service.addPlayerToRoom('r1', 'u2'));

      expect(updateDoc).toHaveBeenCalledWith('rooms/r1', {
        playerIds: { union: 'u2' },
      });
    });

    it('retire un joueur sans reecrire le tableau entier', async () => {
      await firstValueFrom(service.removePlayerFromRoom('r1', 'u2'));

      expect(updateDoc).toHaveBeenCalledWith('rooms/r1', {
        playerIds: { remove: 'u2' },
      });
    });

    it('refuse d entrer ou de sortir sans identifiant de salle', async () => {
      for (const action of [
        service.addPlayerToRoom(undefined, 'u2'),
        service.removePlayerFromRoom(undefined, 'u2'),
      ]) {
        const failure = await new Promise((resolve) =>
          action.subscribe({ error: resolve }),
        );
        expect(failure).toBe('ID de salle manquant.');
      }
    });

    it('sort le joueur de toutes les salles sauf celle qu il rejoint', async () => {
      snapshots = [
        snapshot([
          buildRoom({ id: 'gardee' }),
          buildRoom({ id: 'ancienne1' }),
          buildRoom({ id: 'ancienne2' }),
        ]),
      ];

      await firstValueFrom(service.leaveOtherRooms('gardee'));

      expect(batchUpdate).toHaveBeenCalledTimes(2);
      expect(batchUpdate.mock.calls.map((call) => call[0])).toEqual([
        'rooms/ancienne1',
        'rooms/ancienne2',
      ]);
      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('ne commet rien quand il n y a aucune salle a quitter', async () => {
      snapshots = [snapshot([buildRoom({ id: 'gardee' })])];

      await firstValueFrom(service.leaveOtherRooms('gardee'));

      expect(commit).not.toHaveBeenCalled();
    });

    it('ne cherche rien quand personne n est connecte', async () => {
      currentUser = null;

      await firstValueFrom(service.leaveOtherRooms('gardee'));

      expect(queries).toEqual([]);
    });
  });

  describe('salles abandonnees', () => {
    it('reconnait une salle sans activite depuis trop longtemps', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
      const room = buildRoom({
        lastActivityAt: new Date(2026, 0, 1, 11, 0, 0),
      });

      expect(service.isStale(room, 30 * 60 * 1000)).toBe(true);
      expect(service.isStale(room, 2 * 60 * 60 * 1000)).toBe(false);
    });

    it('retombe sur la date de creation faute d activite', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
      const room = buildRoom({ createdAt: new Date(2026, 0, 1, 10, 0, 0) });

      expect(service.isStale(room, 30 * 60 * 1000)).toBe(true);
    });

    it('lit aussi une date rendue par Firestore', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
      const room = buildRoom({
        lastActivityAt: new FakeTimestamp(
          new Date(2026, 0, 1, 11, 0, 0),
        ) as unknown as Date,
      });

      expect(service.isStale(room, 30 * 60 * 1000)).toBe(true);
    });

    it('ne declare pas abandonnee une salle sans aucune date', () => {
      const room = buildRoom({
        createdAt: undefined,
        lastActivityAt: undefined,
      });

      expect(service.isStale(room, 0)).toBe(false);
    });

    it('ne declare pas abandonnee une salle dont la date est inexploitable', () => {
      const room = buildRoom({
        lastActivityAt: 'hier' as unknown as Date,
      });

      expect(service.isStale(room, 0)).toBe(false);
    });
  });

  describe('suppression du compte', () => {
    it('supprime en un lot toutes les salles creees par le compte', async () => {
      snapshots = [
        snapshot([buildRoom({ id: 'r1' }), buildRoom({ id: 'r2' })]),
      ];

      await firstValueFrom(service.deleteUserRooms());

      expect(batchDelete).toHaveBeenCalledTimes(2);
      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('ne commet rien quand le compte n a cree aucune salle', async () => {
      snapshots = [snapshot([])];

      await firstValueFrom(service.deleteUserRooms());

      expect(commit).not.toHaveBeenCalled();
    });
  });

  describe('code de salle', () => {
    it('tire un code de quatre caracteres qui se lisent a voix haute', () => {
      for (let attempt = 0; attempt < 50; attempt++) {
        expect(service.generateRoomCode()).toMatch(
          /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/,
        );
      }
    });

    it('retire un code deja pris', async () => {
      snapshots = [snapshot([buildRoom({ id: 'r1' })]), snapshot([])];

      const code = await firstValueFrom(service.generateUniqueRoomCode());

      expect(code).toHaveLength(4);
      expect(snapshots).toHaveLength(0);
    });

    it('garde le dernier tirage plutot que de bloquer la creation', async () => {
      snapshots = Array.from({ length: 5 }, () =>
        snapshot([buildRoom({ id: 'r1' })]),
      );

      const code = await firstValueFrom(service.generateUniqueRoomCode());

      expect(code).toHaveLength(4);
      // Le cinquieme tirage est garde sans etre verifie : quatre requetes seulement.
      expect(snapshots).toHaveLength(1);
    });
  });

  describe('prechargement des donnees de jeu', () => {
    it('ne precharge rien sur une connexion qui ne suit pas', () => {
      shouldPreload.mockReturnValue(false);

      expect(() => service.preloadGameData('motus')).not.toThrow();
    });

    it('precharge sans echouer un jeu connu comme un catalogue entier', () => {
      expect(() => service.preloadGameData('motus')).not.toThrow();
      expect(() => service.preloadGameData('inconnu')).not.toThrow();
    });
  });

  describe('tirage des manches', () => {
    it('rend une partie vide pour un jeu qui n existe pas', async () => {
      await expect(
        service.drawRounds(buildRoom({ gameName: 'inconnu' })),
      ).resolves.toEqual([]);
    });

    it('demande au jeu de tirer ses manches', async () => {
      const rounds = await service.drawRounds(
        buildRoom({ gameName: 'motus', stepsNumber: 2 }),
      );

      expect(rounds).toHaveLength(2);
    });
  });
});
