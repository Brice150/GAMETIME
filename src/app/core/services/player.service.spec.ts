import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Observable, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from '../interfaces/player';
import { buildPlayer } from '../../../testing/test-providers';
import { PlayerService } from './player.service';
import { UserService } from './user.service';

// Le service appelle les fonctions du SDK Firestore directement : on les remplace au niveau du
// module. Chaque requete est reduite a la clause qu'elle porte, ce qui suffit a verifier ce que le
// service demande sans monter de base.
interface Clause {
  field: string;
  op: string;
  value: unknown;
}

const setDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const updateDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const deleteDoc = vi.fn((path: string) => Promise.resolve(path));
const commit = vi.fn(() => Promise.resolve());
const batchUpdate = vi.fn((path: string, data: Record<string, unknown>) => ({
  path,
  data,
}));
const batchDelete = vi.fn((ref: string) => ref);
let queries: Clause[][] = [];
let snapshots: {
  docs: { data: () => unknown; ref: string }[];
  empty: boolean;
}[] = [];
let streams: Player[][] = [];

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: (_firestore: unknown, path: string) => ({ path, clauses: [] }),
  doc: (target: unknown, path?: string) =>
    typeof path === 'string' ? path : 'players/genere',
  query: (source: { clauses?: Clause[] }, ...clauses: Clause[]) => {
    const merged = [...(source.clauses ?? []), ...clauses.filter(Boolean)];
    queries.push(merged);
    return { ...source, clauses: merged };
  },
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  limit: () => null,
  setDoc: (path: string, data: Record<string, unknown>) => setDoc(path, data),
  updateDoc: (path: string, data: Record<string, unknown>) =>
    updateDoc(path, data),
  deleteDoc: (path: string) => deleteDoc(path),
  getDocs: () =>
    Promise.resolve(snapshots.shift() ?? { docs: [], empty: true }),
  collectionData: () => of(streams.shift() ?? []),
  writeBatch: () => ({
    update: batchUpdate,
    delete: batchDelete,
    commit,
  }),
}));

describe('PlayerService', () => {
  let service: PlayerService;
  let currentUser: { uid: string; email: string | null } | null;

  /** La clause portee par la derniere requete construite. */
  function lastClauses(): Clause[] {
    return queries[queries.length - 1];
  }

  /** Un instantane Firestore qui rend les joueurs donnes. */
  function snapshot(players: Player[]) {
    return {
      empty: players.length === 0,
      docs: players.map((player) => ({
        data: () => player,
        ref: `players/${player.id}`,
      })),
    };
  }

  function build(): PlayerService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
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
    return TestBed.inject(PlayerService);
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
    currentUser = { uid: 'u1', email: 'alice.martin@example.com' };
    service = build();
  });

  describe('lecture', () => {
    it('ne demande que la fiche du compte connecte', async () => {
      streams = [[buildPlayer({ userId: 'u1' })]];

      const players = await firstValueFrom(service.getPlayer());

      expect(lastClauses()).toContainEqual({
        field: 'userId',
        op: '==',
        value: 'u1',
      });
      expect(players).toHaveLength(1);
    });

    it('ne demande rien pour une liste de joueurs vide', async () => {
      const players = await firstValueFrom(service.getPlayers([]));

      expect(players).toEqual([]);
      expect(queries).toEqual([]);
    });

    it('demande une seule requete sous le plafond de trente', async () => {
      streams = [[buildPlayer()]];

      await firstValueFrom(service.getPlayers(['u1', 'u2']));

      expect(queries).toHaveLength(1);
      expect(lastClauses()).toContainEqual({
        field: 'userId',
        op: 'in',
        value: ['u1', 'u2'],
      });
    });

    it('decoupe au-dela du plafond de trente que Firestore impose', async () => {
      const ids = Array.from({ length: 31 }, (_, index) => `u${index}`);
      streams = [[buildPlayer({ id: 'a' })], [buildPlayer({ id: 'b' })]];

      const players = await firstValueFrom(service.getPlayers(ids));

      expect(queries).toHaveLength(2);
      expect((queries[0][0] as Clause).value).toHaveLength(30);
      expect((queries[1][0] as Clause).value).toHaveLength(1);
      expect(players.map((player) => player.id)).toEqual(['a', 'b']);
    });

    it('partage une seule ecoute de la collection entre tous ses lecteurs', () => {
      streams = [[buildPlayer()]];

      const first = service.getAllPlayers();
      const second = service.getAllPlayers();

      expect(second).toBe(first);
      expect(queries).toHaveLength(1);
    });

    it('rend la fiche des qu elle arrive, et une seule fois', async () => {
      const player = buildPlayer();
      const ready = firstValueFrom(service.playerReady$);

      service.currentPlayerSig.set(player);

      await expect(ready).resolves.toBe(player);
    });
  });

  describe('creation', () => {
    it('ne recree pas une fiche qui existe deja', async () => {
      snapshots = [snapshot([buildPlayer()])];

      const email = await firstValueFrom(service.addPlayer());

      expect(email).toBe('alice.martin@example.com');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('cree une fiche vierge au premier passage', async () => {
      snapshots = [snapshot([]), snapshot([])];

      const email = await firstValueFrom(service.addPlayer());

      expect(email).toBe('alice.martin@example.com');
      const created = setDoc.mock.lastCall![1] as Partial<Player>;
      expect(created).toMatchObject({
        userId: 'u1',
        username: 'Alice',
        stats: [],
        isAdmin: false,
        friendIds: [],
      });
      expect(created.animal).toBeTruthy();
    });

    it('numerote le pseudo tant qu il est deja pris', async () => {
      snapshots = [
        snapshot([]),
        snapshot([buildPlayer()]),
        snapshot([buildPlayer()]),
        snapshot([]),
      ];

      await firstValueFrom(service.addPlayer());

      expect((setDoc.mock.lastCall![1] as Partial<Player>).username).toBe(
        'Alice3',
      );
    });

    it('renonce a numeroter apres dix tentatives', async () => {
      snapshots = [snapshot([]), ...Array(9).fill(snapshot([buildPlayer()]))];

      await firstValueFrom(service.addPlayer());

      expect((setDoc.mock.lastCall![1] as Partial<Player>).username).toBe(
        'Alice10',
      );
    });
  });

  describe('pseudo et animal', () => {
    it('tire le pseudo de la partie locale de l adresse', () => {
      expect(service.extractNameFromEmail('alice.martin@example.com')).toBe(
        'alice',
      );
      expect(service.extractNameFromEmail('bob@example.com')).toBe('bob');
    });

    it('retire ce qui n est ni lettre ni chiffre', () => {
      expect(service.extractNameFromEmail('a-l_i+ce@example.com')).toBe(
        'alice',
      );
    });

    it('ne tire rien d une adresse absente ou mal formee', () => {
      expect(service.extractNameFromEmail(null)).toBeNull();
      expect(service.extractNameFromEmail('pas-une-adresse')).toBeNull();
    });

    it('met le pseudo en capitale initiale', () => {
      expect(service.generateRandomUsername('bob@example.com')).toBe('Bob');
    });

    it('fabrique un pseudo de repli sans adresse', () => {
      expect(service.generateRandomUsername(null)).toMatch(/^User#.{4}$/);
    });

    it('tire un animal parmi ceux du jeu', () => {
      expect(service.generateRandomAnimal()).toBeTruthy();
    });
  });

  describe('ecriture', () => {
    it('met a jour une fiche sans reecrire son identifiant', async () => {
      const player = buildPlayer({ id: 'p1', username: 'Alice' });

      await firstValueFrom(service.updatePlayer(player));

      expect(updateDoc.mock.lastCall![0]).toBe('players/p1');
      expect(updateDoc.mock.lastCall![1]).not.toHaveProperty('id');
      expect(updateDoc.mock.lastCall![1]).toMatchObject({ username: 'Alice' });
    });

    it('refuse de mettre a jour une fiche sans identifiant', async () => {
      const player = { ...buildPlayer(), id: undefined } as unknown as Player;

      const failure = await new Promise((resolve) =>
        service.updatePlayer(player).subscribe({ error: resolve }),
      );

      expect(failure).toBe('ID de joueur manquant.');
    });

    it('ecrit les seuls champs demandes', async () => {
      await firstValueFrom(service.updatePlayerFields('p1', { isReady: true }));

      expect(updateDoc).toHaveBeenCalledWith('players/p1', { isReady: true });
    });

    it('refuse d ecrire des champs sans identifiant', async () => {
      const failure = await new Promise((resolve) =>
        service
          .updatePlayerFields(undefined, { isReady: true })
          .subscribe({ error: resolve }),
      );

      expect(failure).toBe('ID de joueur manquant.');
    });

    it('supprime une fiche par son identifiant', async () => {
      await firstValueFrom(service.deletePlayer('p1'));

      expect(deleteDoc).toHaveBeenCalledWith('players/p1');
    });
  });

  describe('remise a zero avant une partie', () => {
    it('ne touche a rien sans joueur', async () => {
      await firstValueFrom(service.resetPlayersState([]));

      expect(commit).not.toHaveBeenCalled();
    });

    it('refuse le lot quand une fiche n a pas d identifiant', async () => {
      const players = [
        buildPlayer({ id: 'p1' }),
        { ...buildPlayer(), id: undefined } as unknown as Player,
      ];

      const failure = await new Promise((resolve) =>
        service.resetPlayersState(players).subscribe({ error: resolve }),
      );

      expect(failure).toBe('ID de joueur manquant.');
      expect(commit).not.toHaveBeenCalled();
    });

    it('remet le seul etat de partie a zero, en un lot', async () => {
      const players = [buildPlayer({ id: 'p1' }), buildPlayer({ id: 'p2' })];

      await firstValueFrom(service.resetPlayersState(players));

      expect(batchUpdate).toHaveBeenCalledTimes(2);
      expect(batchUpdate.mock.lastCall![0]).toBe('players/p2');
      // Les medailles ne figurent pas dans le lot : les reecrire ramenerait en arriere une fiche
      // qui a evolue depuis, et les regles refuseraient tout le lancement.
      expect(batchUpdate.mock.lastCall![1]).toEqual({
        currentRoomWins: [],
        finishDate: null,
        durationMs: null,
        isReady: false,
        currentRoundProgress: null,
        vote: null,
      });
      expect(commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('suppression du compte', () => {
    it('ne commet rien quand le compte n a aucune fiche', async () => {
      snapshots = [snapshot([])];

      await firstValueFrom(service.deleteUserPlayer() as Observable<void>);

      expect(commit).not.toHaveBeenCalled();
    });

    it('supprime en un lot toutes les fiches du compte', async () => {
      snapshots = [
        snapshot([buildPlayer({ id: 'p1' }), buildPlayer({ id: 'p2' })]),
      ];

      await firstValueFrom(service.deleteUserPlayer() as Observable<void>);

      expect(batchDelete).toHaveBeenCalledTimes(2);
      expect(commit).toHaveBeenCalledTimes(1);
    });
  });
});
