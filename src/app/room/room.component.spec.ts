import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anyGameVoteKey } from '../../assets/data/games';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../testing/test-providers';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { RoomComponent } from './room.component';

/** Laisse le tirage des manches, une promesse, se resoudre. */
const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('RoomComponent', () => {
  async function buildFixture(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<ComponentFixture<RoomComponent>> {
    await TestBed.configureTestingModule({
      imports: [RoomComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(RoomComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<RoomComponent> {
    return (await buildFixture(extra)).componentInstance;
  }

  /** Le composant mute le joueur courant en place : chaque test a le sien. */
  function currentPlayer(component: RoomComponent, player: Player): Player {
    component.playerService.currentPlayerSig.set(player);
    return player;
  }

  /** La vue du jeu n'existe qu'en partie lancee : on la double. */
  function stubWordGames(component: RoomComponent): ReturnType<typeof vi.fn> {
    const next = vi.fn();
    (
      component as unknown as { wordGamesComponent: () => { new: () => void } }
    ).wordGamesComponent = () => ({ new: next });
    return next;
  }

  /** Fenetre modale rendue sans l'ouvrir : seule sa reponse compte. */
  function stubDialog(component: RoomComponent, answer: unknown) {
    return vi
      .spyOn(component.dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(answer) } as never);
  }

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('depouillement des votes', () => {
    it('designe le jeu majoritaire', async () => {
      const component = await build();
      component.players = [
        buildPlayer({ id: 'p1', userId: 'u1', vote: 'motus' }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: 'motus' }),
        buildPlayer({ id: 'p3', userId: 'u3', vote: 'drapeaux' }),
      ];

      expect(component.winningVote()).toBe('motus');
    });

    it('compte un joueur sans vote comme « Peu importe »', async () => {
      const component = await build();
      component.players = [
        buildPlayer({ id: 'p1', userId: 'u1', vote: anyGameVoteKey }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
        buildPlayer({ id: 'p3', userId: 'u3', vote: 'motus' }),
      ];

      expect(component.winningVote()).toBe(anyGameVoteKey);
    });

    it('tranche une egalite en faveur du premier choix propose', async () => {
      const component = await build();
      component.players = [
        buildPlayer({ id: 'p1', userId: 'u1', vote: 'motus' }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
      ];

      expect(component.winningVote()).toBe('motus');
    });

    it('ne compte ni le vote ni le silence de l hote', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'host' });
      component.players = [
        buildPlayer({ id: 'p1', userId: 'host', vote: 'drapeaux' }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: 'motus' }),
      ];

      // Sans cette exclusion, « drapeaux » l'emportait sur l'egalite.
      expect(component.winningVote()).toBe('motus');
    });

    it('ne designe rien quand seul l hote a vote', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'host' });
      component.players = [
        buildPlayer({ id: 'p1', userId: 'host', vote: 'motus' }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
      ];

      expect(component.winningVote()).toBeNull();
    });

    it('ne designe rien quand personne n a vote', async () => {
      const component = await build();
      component.players = [
        buildPlayer({ id: 'p1', userId: 'u1', vote: null }),
        buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
      ];

      expect(component.winningVote()).toBeNull();
    });
  });

  describe('ecoute de la room', () => {
    it('affiche la room et ses joueurs', async () => {
      const component = await build([
        override(RoomService, {
          getRoom: () => of(buildRoom({ playerIds: ['u1'] })),
        }),
      ]);

      expect(component.room.id).toBe('r1');
      expect(component.players.length).toBe(1);
      expect(component.loading()).toBe(false);
    });

    it('signale un echec d ecoute et rend la main', async () => {
      const component = await build([
        override(RoomService, {
          getRoom: () => throwError(() => new Error('boom')),
        }),
      ]);

      expect(component.loading()).toBe(false);
    });

    it('ne recree pas l ecoute des joueurs a chaque ecriture sur la room', async () => {
      const rooms = new Subject<Room>();
      const getPlayers = vi.fn(() => of([buildPlayer()]));
      const component = await build([
        override(RoomService, { getRoom: () => rooms }),
        override(PlayerService, { getPlayers }),
      ]);

      rooms.next(buildRoom({ playerIds: ['u1'] }));
      rooms.next(buildRoom({ playerIds: ['u1'], isStarted: true }));
      expect(getPlayers).toHaveBeenCalledTimes(1);

      // Un joueur de plus, en revanche, demande une nouvelle ecoute.
      rooms.next(buildRoom({ playerIds: ['u1', 'u2'] }));
      expect(getPlayers).toHaveBeenCalledTimes(2);
      expect(component.room.playerIds).toEqual(['u1', 'u2']);
    });

    it('n ecoute aucun joueur tant que la room est vide', async () => {
      const component = await build([
        override(RoomService, {
          getRoom: () => of(buildRoom({ playerIds: [] })),
        }),
        override(PlayerService, { currentPlayerSig: signal(null) }),
      ]);

      expect(component.players).toEqual([]);
    });
  });

  describe('handleRoom', () => {
    it('renvoie a l accueil quand l hote supprime la room', async () => {
      const component = await build();
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);
      const error = vi.spyOn(component.toastrHelper, 'error');

      expect(component.handleRoom(null)).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/accueil']);
      expect(error).toHaveBeenCalledWith("L'hôte a supprimé la room");
    });

    it('ne signale rien au joueur qui vient de partir', async () => {
      const component = await build();
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const error = vi.spyOn(component.toastrHelper, 'error');
      component.userLeft = true;

      component.handleRoom(null);

      expect(error).not.toHaveBeenCalled();
    });

    it('signale une exclusion', async () => {
      const component = await build();
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const error = vi.spyOn(component.toastrHelper, 'error');
      component.room = buildRoom({ playerIds: ['u1'] });

      component.handleRoom(buildRoom({ playerIds: ['u2'] }));

      expect(component.userKickedOut).toBe(true);
      expect(error).toHaveBeenCalledWith('Vous avez été exclu de la room');
    });

    it('quitte la page resultats quand une nouvelle partie demarre', async () => {
      const component = await build();
      component.room = buildRoom({
        playerIds: ['u1'],
        startDate: new Date(1000),
      });
      component.isResultPageActive.set(true);
      component.lastRound.set({ stepIndex: 0, response: 'CHAT', won: true });

      component.handleRoom(
        buildRoom({ playerIds: ['u1'], startDate: new Date(2000) }),
      );

      expect(component.isResultPageActive()).toBe(false);
      expect(component.lastRound()).toBeNull();
    });

    it('lit une date de lancement au format Firestore', async () => {
      const component = await build();
      const startDate = Timestamp.fromDate(new Date(1000)) as unknown as Date;
      component.room = buildRoom({ playerIds: ['u1'], startDate });
      component.isResultPageActive.set(true);

      component.handleRoom(buildRoom({ playerIds: ['u1'], startDate }));

      // Meme instant des deux cotes : la page resultats reste en place.
      expect(component.isResultPageActive()).toBe(true);
    });

    it('precharge les donnees du jeu tant que la partie n est pas lancee', async () => {
      const component = await build();
      const preload = vi.spyOn(component.roomService, 'preloadGameData');

      component.handleRoom(buildRoom({ playerIds: ['u1'] }));

      expect(preload).toHaveBeenCalledWith('motus');
    });

    it('ne precharge plus rien une fois la partie lancee', async () => {
      const component = await build();
      const preload = vi.spyOn(component.roomService, 'preloadGameData');

      component.handleRoom(buildRoom({ playerIds: ['u1'], isStarted: true }));

      expect(preload).not.toHaveBeenCalled();
    });

    it('inscrit le joueur qui n est pas encore dans la room', async () => {
      const component = await build();
      const addPlayer = vi.spyOn(component.roomService, 'addPlayerToRoom');
      const leaveOthers = vi.spyOn(component.roomService, 'leaveOtherRooms');
      const newGame = vi.spyOn(component.localStorageService, 'newGame');

      const room = component.handleRoom(buildRoom({ playerIds: ['u2'] }));

      expect(room?.playerIds).toContain('u1');
      expect(newGame).toHaveBeenCalledWith('r1');
      expect(leaveOthers).toHaveBeenCalledWith('r1');
      expect(addPlayer).toHaveBeenCalledWith('r1', 'u1');
      expect(component.loading()).toBe(false);
    });

    it('signale un echec d inscription', async () => {
      const component = await build();
      vi.spyOn(component.roomService, 'addPlayerToRoom').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.handleRoom(buildRoom({ playerIds: ['u2'] }));

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });

    it('laisse regarder un visiteur sans fiche joueur', async () => {
      const component = await build();
      component.playerService.currentPlayerSig.set(null);
      const addPlayer = vi.spyOn(component.roomService, 'addPlayerToRoom');

      expect(
        component.handleRoom(buildRoom({ playerIds: ['u2'] })),
      ).toBeTruthy();
      expect(addPlayer).not.toHaveBeenCalled();
    });

    it('n inscrit pas le joueur exclu', async () => {
      const component = await build();
      component.userKickedOut = true;
      const addPlayer = vi.spyOn(component.roomService, 'addPlayerToRoom');

      component.handleRoom(buildRoom({ playerIds: ['u2'] }));

      expect(addPlayer).not.toHaveBeenCalled();
    });
  });

  describe('classement des joueurs', () => {
    it('garde l ordre recu avant le lancement', async () => {
      const component = await build();
      component.room = buildRoom();

      component.handlePlayers([
        buildPlayer({ id: 'p2', userId: 'u2' }),
        buildPlayer({ id: 'p1', userId: 'u1' }),
      ]);

      expect(component.players.map((player) => player.id)).toEqual([
        'p2',
        'p1',
      ]);
    });

    it('classe par manches gagnees, puis par temps, puis par lettres', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      currentPlayer(component, buildPlayer({ userId: 'u1' }));

      component.handlePlayers([
        buildPlayer({
          id: 'lent',
          userId: 'u2',
          currentRoomWins: [true],
          durationMs: 9000,
        }),
        buildPlayer({
          id: 'rapide',
          userId: 'u3',
          currentRoomWins: [true],
          durationMs: 1000,
        }),
        buildPlayer({
          id: 'meilleur',
          userId: 'u4',
          currentRoomWins: [true, true],
          durationMs: 5000,
        }),
        buildPlayer({
          id: 'encours',
          userId: 'u5',
          currentRoomWins: [true],
          durationMs: null,
          currentRoundProgress: {
            stepIndex: 1,
            lettersFound: 3,
            lettersTotal: 5,
          },
        }),
        buildPlayer({
          id: 'perdu',
          userId: 'u6',
          currentRoomWins: [true],
          durationMs: null,
        }),
      ]);

      expect(component.players.map((player) => player.id)).toEqual([
        'meilleur',
        'rapide',
        'lent',
        'encours',
        'perdu',
      ]);
    });

    it('ne compte les lettres que de la manche en cours', async () => {
      const component = await build();
      const behind = buildPlayer({
        currentRoomWins: [true],
        currentRoundProgress: {
          stepIndex: 0,
          lettersFound: 4,
          lettersTotal: 5,
        },
      });

      expect(component.lettersFound(behind)).toBe(0);
      expect(component.lettersFound(buildPlayer())).toBe(0);
    });

    it('bascule sur les resultats quand toutes les manches sont faites', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      const player = currentPlayer(
        component,
        buildPlayer({ currentRoomWins: [true, false, true] }),
      );
      const seeResults = vi
        .spyOn(component, 'seeResults')
        .mockImplementation(() => undefined);

      component.handlePlayers([player]);

      expect(seeResults).toHaveBeenCalled();
    });

    it('reste sur les resultats pour un joueur deja arrive', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      const player = currentPlayer(
        component,
        buildPlayer({
          currentRoomWins: [true, true, true],
          finishDate: new Date(),
        }),
      );

      component.handlePlayers([player]);

      expect(component.isResultPageActive()).toBe(true);
    });

    it('laisse les trois secondes de lecture avant les resultats', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      component.isFinishing.set(true);
      const player = currentPlayer(
        component,
        buildPlayer({
          currentRoomWins: [true, true, true],
          finishDate: new Date(),
        }),
      );

      component.handlePlayers([player]);

      expect(component.isResultPageActive()).toBe(false);
    });

    it('affiche les resultats a qui a fini une partie encore ouverte', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      const player = currentPlayer(
        component,
        buildPlayer({ currentRoomWins: [true], finishDate: new Date() }),
      );

      component.handlePlayers([player]);

      expect(component.isResultPageActive()).toBe(true);
    });

    it('patiente pendant le tirage des manches', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true, isLoading: true });

      component.handlePlayers([buildPlayer()]);

      expect(component.loading()).toBe(true);
    });
  });

  describe('arrivee apres la fin de la partie', () => {
    /** Une partie deja finie par son unique participant, et un nouveau venu. */
    function lateJoiner(component: RoomComponent): Player {
      component.room = buildRoom({
        isStarted: true,
        startedPlayerIds: ['u2'],
      });
      component.players = [
        buildPlayer({ id: 'p2', userId: 'u2', finishDate: new Date() }),
      ];
      return currentPlayer(component, buildPlayer({ userId: 'u1' }));
    }

    it('reconnait un joueur arrive apres la derniere arrivee', async () => {
      const component = await build();
      const player = lateJoiner(component);

      expect(component.isLateJoinerAfterEnd(player)).toBe(true);
    });

    it('ecarte les joueurs de la partie en cours', async () => {
      const component = await build();
      const player = lateJoiner(component);
      component.room.startedPlayerIds = ['u1', 'u2'];

      expect(component.isLateJoinerAfterEnd(player)).toBe(false);
    });

    it('ecarte un joueur ayant deja joue une manche', async () => {
      const component = await build();
      const player = lateJoiner(component);
      player.currentRoomWins = [true];

      expect(component.isLateJoinerAfterEnd(player)).toBe(false);
    });

    it('ecarte le cas ou un participant joue encore', async () => {
      const component = await build();
      const player = lateJoiner(component);
      component.players[0].finishDate = null;

      expect(component.isLateJoinerAfterEnd(player)).toBe(false);
    });

    it('ecarte une partie non lancee ou sans participant connu', async () => {
      const component = await build();
      const player = lateJoiner(component);
      component.room.startedPlayerIds = [];

      expect(component.isLateJoinerAfterEnd(player)).toBe(false);
      expect(component.isLateJoinerAfterEnd(null)).toBe(false);
    });

    it('classe le retardataire sans le faire jouer', async () => {
      const component = await build();
      const player = lateJoiner(component);
      const info = vi.spyOn(component.toastrHelper, 'info');
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.handlePlayers([...component.players, player]);

      expect(player.finishDate).toBeInstanceOf(Date);
      expect(player.isReady).toBe(true);
      expect(component.isResultPageActive()).toBe(true);
      expect(update).toHaveBeenCalled();
      expect(info).toHaveBeenCalled();
    });

    it('signale un echec d enregistrement du retardataire', async () => {
      const component = await build();
      const player = lateJoiner(component);
      vi.spyOn(component.playerService, 'updatePlayerFields').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.skipFinishedRound(player);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('fin de manche', () => {
    function started(component: RoomComponent): Player {
      component.room = buildRoom({ isStarted: true, startDate: new Date() });
      return currentPlayer(component, buildPlayer());
    }

    it('ne fait rien sans fiche joueur', async () => {
      const component = await build();
      component.playerService.currentPlayerSig.set(null);
      const submit = vi.spyOn(component.gameApi, 'submitRound');

      component.updatePlayerGame({ won: true, answer: 'CHAT' });

      expect(submit).not.toHaveBeenCalled();
    });

    it('avance l affichage puis suit le verdict du serveur', async () => {
      const component = await build();
      const player = started(component);
      const next = stubWordGames(component);
      vi.spyOn(component.gameApi, 'submitRound').mockReturnValue(
        of({
          won: false,
          currentRoomWins: [false],
          finished: false,
          medalsNumber: 4,
        }),
      );
      vi.useFakeTimers();

      component.updatePlayerGame({ won: true, answer: 'CHAT' });

      expect(player.currentRoomWins).toEqual([false]);
      expect(component.lastRound()).toEqual({
        stepIndex: 0,
        response: 'CHAT',
        won: false,
      });

      vi.advanceTimersByTime(1000);
      expect(next).toHaveBeenCalled();
    });

    it('revient en arriere si la manche n a pas pu partir', async () => {
      const component = await build();
      const player = started(component);
      vi.spyOn(component.gameApi, 'submitRound').mockReturnValue(
        throwError(() => new Error('hors ligne')),
      );
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.updatePlayerGame({ won: true, answer: 'CHAT' });

      expect(player.currentRoomWins).toEqual([]);
      expect(error).toHaveBeenCalled();
    });

    it('horodate l arrivee a la derniere manche', async () => {
      const component = await build();
      const player = started(component);
      player.currentRoomWins = [true, true];
      vi.spyOn(component.gameApi, 'submitRound').mockReturnValue(EMPTY);
      vi.useFakeTimers();

      component.updatePlayerGame({ won: true, answer: 'CHEVAL' });

      expect(player.finishDate).toBeInstanceOf(Date);
      expect(player.isReady).toBe(true);
      expect(component.isFinishing()).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(component.isResultPageActive()).toBe(true);
      expect(component.isFinishing()).toBe(false);
    });

    it('annonce un succes atteint', async () => {
      const component = await build();
      started(component);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.announceGoal(10, true);

      expect(info).toHaveBeenCalledWith(
        'Vous avez obtenu le succès : Obtenir 10 médailles',
        'Motus',
      );
    });

    it('n annonce rien sur une manche perdue ou un palier non atteint', async () => {
      const component = await build();
      started(component);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.announceGoal(10, false);
      component.announceGoal(11, true);

      expect(info).not.toHaveBeenCalled();
    });

    it('prend le chrono local quand il est disponible', async () => {
      const component = await build();
      const player = started(component);
      vi.spyOn(component.localStorageService, 'getElapsedMs').mockReturnValue(
        4200,
      );

      component.stampFinish(player);

      expect(player.durationMs).toBe(4200);
    });

    it('retombe sur l heure de lancement de la room', async () => {
      const component = await build();
      component.room = buildRoom({ startDate: new Date(Date.now() - 5000) });

      expect(component.elapsedSinceRoomStart()).toBeGreaterThanOrEqual(5000);
    });

    it('lit une heure de lancement au format Firestore', async () => {
      const component = await build();
      component.room = buildRoom({
        startDate: Timestamp.fromDate(
          new Date(Date.now() - 5000),
        ) as unknown as Date,
      });

      expect(component.elapsedSinceRoomStart()).toBeGreaterThanOrEqual(5000);
    });

    it('ne compte aucun temps sur une room jamais lancee', async () => {
      const component = await build();
      component.room = buildRoom({ startDate: null });

      expect(component.elapsedSinceRoomStart()).toBeNull();
    });

    it('n enchaine pas de manche apres la derniere', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      const next = stubWordGames(component);
      vi.useFakeTimers();

      component.handlePlayerNextAction(true, 2);

      vi.advanceTimersByTime(1000);
      expect(component.lastRound()?.stepIndex).toBe(2);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('progression publiee', () => {
    it('publie l avancee de la manche en cours', async () => {
      const component = await build();
      const player = currentPlayer(component, buildPlayer());
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.publishProgress({ lettersFound: 2, lettersTotal: 5 });

      expect(player.currentRoundProgress).toEqual({
        stepIndex: 0,
        lettersFound: 2,
        lettersTotal: 5,
      });
      expect(update).toHaveBeenCalled();
    });

    it('se tait pour un joueur arrive, ou sans manche a jouer', async () => {
      const component = await build();
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      currentPlayer(component, buildPlayer({ finishDate: new Date() }));
      component.publishProgress({ lettersFound: 2, lettersTotal: 5 });

      currentPlayer(component, buildPlayer());
      component.publishProgress({ lettersFound: 0, lettersTotal: 0 });

      component.playerService.currentPlayerSig.set(null);
      component.publishProgress({ lettersFound: 1, lettersTotal: 5 });

      expect(update).not.toHaveBeenCalled();
    });

    it('avale un echec de publication', async () => {
      const component = await build();
      currentPlayer(component, buildPlayer());
      vi.spyOn(component.playerService, 'updatePlayerFields').mockReturnValue(
        throwError(() => new Error('refus')),
      );

      expect(() =>
        component.publishProgress({ lettersFound: 2, lettersTotal: 5 }),
      ).not.toThrow();
    });
  });

  describe('sortie de room', () => {
    it('propose la suppression a l hote', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'u1' });
      stubDialog(component, true);
      const deleteRoom = vi
        .spyOn(component, 'deleteRoom')
        .mockImplementation(() => undefined);

      component.openDialog();

      expect(deleteRoom).toHaveBeenCalled();
    });

    it('propose le depart aux autres joueurs', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'host' });
      stubDialog(component, true);
      const leaveRoom = vi
        .spyOn(component, 'leaveRoom')
        .mockImplementation(() => undefined);

      component.openDialog();

      expect(leaveRoom).toHaveBeenCalled();
    });

    it('ne fait rien quand la confirmation est refusee', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'u1' });
      stubDialog(component, false);
      const deleteRoom = vi
        .spyOn(component, 'deleteRoom')
        .mockImplementation(() => undefined);

      component.openDialog();

      expect(deleteRoom).not.toHaveBeenCalled();
    });

    it('remet les joueurs a zero et supprime la room', async () => {
      const component = await build();
      component.room = buildRoom();
      component.players = [
        buildPlayer({ currentRoomWins: [true], finishDate: new Date() }),
      ];
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.deleteRoom();

      expect(component.players[0].currentRoomWins).toEqual([]);
      expect(component.players[0].finishDate).toBeNull();
      expect(component.userLeft).toBe(true);
      expect(info).toHaveBeenCalledWith('La room a été supprimée', 'Room');
    });

    it('signale un refus de suppression', async () => {
      const component = await build();
      component.room = buildRoom();
      vi.spyOn(component.roomService, 'deleteRoom').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.deleteRoom();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });

    it('sort le joueur sans attendre le serveur', async () => {
      const component = await build();
      component.room = buildRoom({ playerIds: ['u1', 'u2'] });
      const player = currentPlayer(
        component,
        buildPlayer({ currentRoomWins: [true], vote: 'motus' }),
      );
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const remove = vi.spyOn(component.roomService, 'removePlayerFromRoom');

      component.leaveRoom();

      expect(component.room.playerIds).toEqual(['u2']);
      expect(player.vote).toBeNull();
      expect(remove).toHaveBeenCalledWith('r1', 'u1');
      expect(component.playerService.currentPlayerSig()).not.toBe(player);
    });

    it('sort un visiteur sans fiche joueur', async () => {
      const component = await build();
      component.room = buildRoom();
      component.playerService.currentPlayerSig.set(null);
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const remove = vi.spyOn(component.roomService, 'removePlayerFromRoom');

      component.leaveRoom();

      expect(remove).not.toHaveBeenCalled();
      expect(component.userLeft).toBe(true);
    });

    it('signale un echec de sortie', async () => {
      const component = await build();
      component.room = buildRoom();
      currentPlayer(component, buildPlayer());
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      vi.spyOn(component.roomService, 'removePlayerFromRoom').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.leaveRoom();

      expect(handleError).toHaveBeenCalled();
    });

    it('tait la disparition d une room deja supprimee', async () => {
      const component = await build();
      component.room = buildRoom();
      currentPlayer(component, buildPlayer());
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      vi.spyOn(component.roomService, 'removePlayerFromRoom').mockReturnValue(
        throwError(() => new Error('No document to update')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.leaveRoom();

      expect(handleError).not.toHaveBeenCalled();
    });

    it('vide l etat partage en quittant la vue', async () => {
      const component = await build();
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);
      const clear = vi.spyOn(
        component.localStorageService,
        'clearLocalStorage',
      );

      component.quitRoomView();

      expect(component.roomService.currentRoomSig()).toBeUndefined();
      expect(component.playerService.currentPlayersSig()).toEqual([]);
      expect(clear).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/accueil']);
    });
  });

  describe('vote', () => {
    it('enregistre un vote et declare le joueur pret', async () => {
      const component = await build();
      component.room = buildRoom();
      const player = currentPlayer(component, buildPlayer());
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.vote('motus');

      expect(player.vote).toBe('motus');
      expect(player.isReady).toBe(true);
      expect(update).toHaveBeenCalledWith('p1', {
        vote: 'motus',
        isReady: true,
      });
    });

    it('retire un vote deja pose', async () => {
      const component = await build();
      component.room = buildRoom();
      const player = currentPlayer(
        component,
        buildPlayer({ vote: 'motus', isReady: true }),
      );

      component.vote('motus');

      expect(player.vote).toBeNull();
      expect(player.isReady).toBe(false);
    });

    it('ne touche pas au statut « pret » en cours de partie', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      const player = currentPlayer(component, buildPlayer({ isReady: false }));
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.vote('drapeaux');

      expect(player.isReady).toBe(false);
      expect(update).toHaveBeenCalledWith('p1', { vote: 'drapeaux' });
    });

    it('ne vote pas sans fiche joueur', async () => {
      const component = await build();
      component.playerService.currentPlayerSig.set(null);
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.vote('motus');

      expect(update).not.toHaveBeenCalled();
    });

    it('signale un echec d enregistrement du vote', async () => {
      const component = await build();
      component.room = buildRoom();
      currentPlayer(component, buildPlayer());
      vi.spyOn(component.playerService, 'updatePlayerFields').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.vote('motus');

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('passage aux resultats', () => {
    it('horodate l arrivee et bascule apres la pause', async () => {
      const component = await build();
      component.room = buildRoom({ startDate: new Date() });
      const player = currentPlayer(component, buildPlayer());
      vi.useFakeTimers();

      component.seeResults();

      expect(player.finishDate).toBeInstanceOf(Date);
      vi.advanceTimersByTime(3000);
      expect(component.isResultPageActive()).toBe(true);
    });

    it('ne rehorodate pas un joueur deja arrive', async () => {
      const component = await build();
      const player = currentPlayer(
        component,
        buildPlayer({ finishDate: new Date(1000) }),
      );

      component.seeResults();

      expect(player.finishDate).toEqual(new Date(1000));
    });

    it('signale un echec d horodatage', async () => {
      const component = await build();
      component.room = buildRoom({ startDate: new Date() });
      currentPlayer(component, buildPlayer());
      vi.spyOn(component.playerService, 'updatePlayerFields').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.seeResults();

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('lancement de partie', () => {
    it('tire les manches et remet les joueurs a zero', async () => {
      const component = await build([
        override(RoomService, {
          drawRounds: () =>
            Promise.resolve([
              { response: 'CHAT', prompt: 'p1', media: 'm1' },
              { response: 'CHIEN', prompt: 'p2', media: 'm2' },
            ]),
        }),
      ]);
      component.room = buildRoom();
      component.players = [buildPlayer({ userId: 'u1', vote: 'motus' })];
      component.isResultPageActive.set(true);

      component.start();
      await flush();

      expect(component.room.responses).toEqual(['CHAT', 'CHIEN']);
      expect(component.room.prompts).toEqual(['p1', 'p2']);
      expect(component.room.isStarted).toBe(true);
      expect(component.room.isLoading).toBe(false);
      expect(component.room.startAgainNumber).toBe(1);
      expect(component.room.startedPlayerIds).toEqual(['u1']);
      expect(component.players[0].vote).toBeNull();
      expect(component.isResultPageActive()).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('remet la room en attente si le lancement echoue', async () => {
      const component = await build();
      component.room = buildRoom();
      vi.spyOn(component.roomService, 'updateRoom').mockReturnValueOnce(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.start();
      await flush();

      expect(component.room.isStarted).toBe(false);
      expect(component.room.startDate).toBeNull();
      expect(component.room.isLoading).toBe(false);
      expect(component.loading()).toBe(false);
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('barre d actions', () => {
    it('ouvre la fenetre d invitation', async () => {
      const component = await build();
      component.room = buildRoom();
      const open = stubDialog(component, null);

      component.multiplayer();

      expect(open).toHaveBeenCalled();
    });

    it('reserve le bouton « Jouer » a l hote', async () => {
      const component = await build();
      component.room = buildRoom({ userId: 'u1' });
      currentPlayer(component, buildPlayer({ userId: 'u1' }));

      expect(component.shouldShowPlayButton()).toBe(true);

      component.room.isStarted = true;
      expect(component.shouldShowPlayButton()).toBe(false);

      component.isResultPageActive.set(true);
      expect(component.shouldShowPlayButton()).toBe(true);

      component.room.userId = 'autre';
      expect(component.shouldShowPlayButton()).toBe(false);
    });

    it('attend que tout le monde ait fini avant de relancer', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      currentPlayer(component, buildPlayer({ userId: 'u1' }));
      component.players = [buildPlayer({ userId: 'u2', finishDate: null })];
      const info = vi.spyOn(component.toastrHelper, 'info');
      const openAddRoom = vi
        .spyOn(component, 'openAddRoomDialog')
        .mockImplementation(() => undefined);

      component.openDialogs();

      expect(info).toHaveBeenCalledWith(
        "Tous les joueurs n'ont pas fini",
        'Joueurs',
      );
      expect(openAddRoom).not.toHaveBeenCalled();
    });

    it('ouvre la fenetre de lancement une fois la manche finie', async () => {
      const component = await build();
      component.room = buildRoom({ isStarted: true });
      currentPlayer(component, buildPlayer({ userId: 'u1' }));
      component.players = [
        buildPlayer({ userId: 'u2', finishDate: new Date() }),
      ];
      const openAddRoom = vi
        .spyOn(component, 'openAddRoomDialog')
        .mockImplementation(() => undefined);

      component.openDialogs();

      expect(openAddRoom).toHaveBeenCalled();
    });

    it('preselectionne le jeu vote et applique les reglages retenus', async () => {
      const component = await build();
      component.room = buildRoom({ gameName: 'motus' });
      component.players = [buildPlayer({ userId: 'u2', vote: 'drapeaux' })];
      const open = stubDialog(component, {
        gameSelected: 'drapeaux',
        showFirstLetter: true,
        stepsNumber: 5,
        categoryFilter: 2,
        isWordLengthIncreasing: false,
        startWordLength: 6,
      });
      const start = vi
        .spyOn(component, 'start')
        .mockImplementation(() => undefined);

      component.openAddRoomDialog();

      expect(open.mock.calls[0][1]?.data).toMatchObject({
        gameSelected: 'drapeaux',
      });
      expect(component.room.gameName).toBe('drapeaux');
      expect(component.room.stepsNumber).toBe(5);
      expect(component.room.startWordLength).toBe(6);
      expect(start).toHaveBeenCalled();
    });

    it('garde le jeu en cours quand le vote ne designe personne', async () => {
      const component = await build();
      component.room = buildRoom({ gameName: 'motus' });
      component.players = [buildPlayer({ userId: 'u2', vote: anyGameVoteKey })];
      const open = stubDialog(component, { gameSelected: '' });
      vi.spyOn(component, 'start').mockImplementation(() => undefined);

      component.openAddRoomDialog();

      expect(open.mock.calls[0][1]?.data).toMatchObject({
        gameSelected: 'motus',
      });
      // Une fenetre fermee sans jeu laisse les reglages en place.
      expect(component.room.gameName).toBe('motus');
    });

    it('ouvre une fenetre vide sur une room pas encore configuree', async () => {
      const component = await build();
      component.room = buildRoom({
        gameName: undefined as never,
        categoryFilter: undefined as never,
      });
      const open = stubDialog(component, null);

      component.openAddRoomDialog();

      expect(open.mock.calls[0][1]?.data).toMatchObject({
        gameSelected: '',
        categoryFilter: undefined,
      });
    });

    it('ne relance rien si la fenetre est fermee', async () => {
      const component = await build();
      component.room = buildRoom();
      stubDialog(component, null);
      const start = vi
        .spyOn(component, 'start')
        .mockImplementation(() => undefined);

      component.openAddRoomDialog();

      expect(start).not.toHaveBeenCalled();
    });
  });

  describe('exclusion d un joueur', () => {
    it('remet le joueur a zero et le sort de la room', async () => {
      const component = await build();
      component.room = buildRoom({ playerIds: ['u1', 'u2'] });
      const other = buildPlayer({
        id: 'p2',
        userId: 'u2',
        currentRoomWins: [true],
        vote: 'motus',
      });
      stubDialog(component, true);
      const remove = vi.spyOn(component.roomService, 'removePlayerFromRoom');

      component.removePlayer(other);

      expect(other.currentRoomWins).toEqual([]);
      expect(other.vote).toBeNull();
      expect(component.room.playerIds).toEqual(['u1']);
      expect(remove).toHaveBeenCalledWith('r1', 'u2');
    });

    it('sort une fiche sans compte associe', async () => {
      const component = await build();
      component.room = buildRoom({ playerIds: ['u1'] });
      stubDialog(component, true);
      const remove = vi.spyOn(component.roomService, 'removePlayerFromRoom');

      component.removePlayer(buildPlayer({ id: 'p2', userId: undefined }));

      expect(remove).not.toHaveBeenCalled();
    });

    it('ne fait rien quand l exclusion est refusee', async () => {
      const component = await build();
      component.room = buildRoom();
      stubDialog(component, false);
      const update = vi.spyOn(component.playerService, 'updatePlayerFields');

      component.removePlayer(buildPlayer({ id: 'p2', userId: 'u2' }));

      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('rendu', () => {
    it('affiche un chargement tant que la room n est pas connue', async () => {
      const fixture = await buildFixture();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('mat-spinner'),
      ).toBeTruthy();
    });

    it('affiche la salle d attente une fois la room chargee', async () => {
      const fixture = await buildFixture([
        override(RoomService, {
          getRoom: () => of(buildRoom({ playerIds: ['u1'] })),
        }),
      ]);
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'app-waiting-room',
        ),
      ).toBeTruthy();
    });

    it('affiche le jeu et le classement provisoire une fois la partie lancee', async () => {
      const fixture = await buildFixture([
        override(RoomService, {
          getRoom: () =>
            of(
              buildRoom({
                playerIds: ['u1'],
                isStarted: true,
                startDate: new Date(),
              }),
            ),
        }),
      ]);
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;

      expect(page.querySelector('app-live-standings')).toBeTruthy();
      expect(page.querySelector('app-word-games')).toBeTruthy();
      expect(fixture.componentInstance.wordGamesComponent()).toBeTruthy();
    });

    it('affiche les resultats une fois la partie terminee', async () => {
      const fixture = await buildFixture([
        override(RoomService, {
          getRoom: () => of(buildRoom({ playerIds: ['u1'], isStarted: true })),
        }),
      ]);
      fixture.componentInstance.isResultPageActive.set(true);
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'app-results-board',
        ),
      ).toBeTruthy();
    });
  });
});
