import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../../testing/test-providers';
import { Player } from '../../core/interfaces/player';
import { FriendService } from '../../core/services/friend.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';
import { FriendsComponent } from './friends.component';

const me = buildPlayer({ id: 'p1', userId: 'u1', username: 'Test' });
const zoe = buildPlayer({ id: 'p2', userId: 'u2', username: 'Zoé' });
const alice = buildPlayer({ id: 'p3', userId: 'u3', username: 'Alice' });

/** Annuaire partage par les tests : le composant l'ecoute a l'ouverture. */
const directory = (player: Player, others = [zoe, alice]): Provider =>
  override(PlayerService, {
    currentPlayerSig: signal(player),
    getAllPlayers: () => of([player, ...others]),
  });

describe('FriendsComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<FriendsComponent> {
    await TestBed.configureTestingModule({
      imports: [FriendsComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(FriendsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('rend la main une fois l annuaire charge', async () => {
    const component = await build([directory(me)]);

    expect(component.loading()).toBe(false);
  });

  it('signale un echec de chargement', async () => {
    const component = await build([
      override(PlayerService, {
        getAllPlayers: () => throwError(() => new Error('refus')),
      }),
    ]);
    expect(component.loading()).toBe(false);
    expect(component.friends()).toEqual([]);
  });

  describe('listes', () => {
    it('classe les amis par pseudo', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendIds: ['u2', 'u3'] })),
      ]);

      expect(component.friends().map((player) => player.id)).toEqual([
        'p3',
        'p2',
      ]);
    });

    it('classe les demandes recues par pseudo', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendRequestIds: ['u2', 'u3'] })),
      ]);

      expect(component.requests().map((player) => player.id)).toEqual([
        'p3',
        'p2',
      ]);
    });

    it('ne liste ni ami ni demande sans fiche joueur', async () => {
      const component = await build([
        override(PlayerService, {
          currentPlayerSig: signal(null),
          getAllPlayers: () => of([zoe, alice]),
        }),
      ]);

      expect(component.friends()).toEqual([]);
      expect(component.requests()).toEqual([]);
    });

    it('ne cherche rien tant que la recherche est vide', async () => {
      const component = await build([directory(me)]);

      expect(component.results()).toEqual([]);
    });

    it('cherche par pseudo, sans se proposer soi-meme', async () => {
      const component = await build([directory(me)]);

      component.searchControl.setValue('zo');

      expect(component.results().map((player) => player.id)).toEqual(['p2']);
    });

    it('accepte une recherche remise a zero', async () => {
      const component = await build([directory(me)]);

      component.searchControl.setValue(null);

      expect(component.results()).toEqual([]);
    });

    it('borne la liste des resultats', async () => {
      const crowd = Array.from({ length: 30 }, (_, index) =>
        buildPlayer({
          id: `x${index}`,
          userId: `ux${index}`,
          username: `Joueur${index.toString().padStart(2, '0')}`,
        }),
      );
      const component = await build([directory(me, crowd)]);

      component.searchControl.setValue('joueur');

      expect(component.results().length).toBe(component.maxResults);
    });
  });

  describe('activite des amis', () => {
    const inRoom = (): Provider =>
      override(RoomService, {
        getRoomsForPlayers: () =>
          of([buildRoom({ id: 'r9', playerIds: ['u2', 'inconnu'] })]),
      });

    it('signale la room en cours d un ami', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendIds: ['u2'] })),
        inRoom(),
      ]);

      expect(component.roomOf(zoe)?.id).toBe('r9');
    });

    it('respecte le joueur qui masque son activite', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendIds: ['u2'] })),
        inRoom(),
      ]);

      expect(
        component.roomOf({ ...zoe, shareActivity: false }),
      ).toBeUndefined();
      expect(component.roomOf({ ...zoe, userId: undefined })).toBeUndefined();
    });

    it('ne signale rien quand l ami n est nulle part', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendIds: ['u3'] })),
        inRoom(),
      ]);

      expect(component.roomOf(alice)).toBeUndefined();
    });

    it('encaisse un echec d ecoute des rooms', async () => {
      const component = await build([
        directory(buildPlayer({ ...me, friendIds: ['u2'] })),
        override(RoomService, {
          getRoomsForPlayers: () => throwError(() => new Error('refus')),
        }),
      ]);

      expect(component.roomOf(zoe)).toBeUndefined();
    });

    it('ne recree pas l ecoute quand la liste d amis ne change pas', async () => {
      const player = buildPlayer({ ...me, friendIds: ['u2'] });
      const getRoomsForPlayers = vi.fn(() => of([]));
      const component = await build([
        directory(player),
        override(RoomService, { getRoomsForPlayers }),
      ]);

      component.playerService.currentPlayerSig.set({
        ...player,
        username: 'Renomme',
      });
      TestBed.tick();
      expect(getRoomsForPlayers).toHaveBeenCalledTimes(1);

      // Un ami de plus, en revanche, demande une nouvelle ecoute.
      component.playerService.currentPlayerSig.set({
        ...player,
        friendIds: ['u2', 'u3'],
      });
      TestBed.tick();
      expect(getRoomsForPlayers).toHaveBeenCalledTimes(2);
    });

    it('rejoint la room d un ami', async () => {
      const component = await build([directory(me)]);
      const newGame = vi.spyOn(component.localStorageService, 'newGame');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);

      component.joinRoom(buildRoom({ id: 'r9' }));

      expect(newGame).toHaveBeenCalledWith('r9');
      expect(navigate).toHaveBeenCalledWith(['/room', 'r9']);
    });
  });

  describe('etat d une relation', () => {
    it('delegue au service d amitie', async () => {
      const component = await build([
        directory(me),
        override(FriendService, {
          isFriend: () => true,
          hasSentRequestTo: () => true,
          hasRequestFrom: () => true,
        }),
      ]);

      expect(component.isFriend(zoe)).toBe(true);
      expect(component.hasSentRequestTo(zoe)).toBe(true);
      expect(component.hasRequestFrom(zoe)).toBe(true);
    });
  });

  describe('actions', () => {
    it('envoie une demande', async () => {
      const component = await build([directory(me)]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.sendRequest(zoe);

      expect(info).toHaveBeenCalledWith('Demande envoyée à Zoé', 'Amis');
    });

    it('scelle l amitie quand la demande etait deja recue', async () => {
      const component = await build([
        directory(me),
        override(FriendService, { hasRequestFrom: () => true }),
      ]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.sendRequest(zoe);

      expect(info).toHaveBeenCalledWith('Zoé est maintenant votre ami', 'Amis');
    });

    it('annule, accepte, refuse et retire', async () => {
      const component = await build([directory(me)]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.cancelRequest(zoe);
      component.acceptRequest(zoe);
      component.declineRequest(zoe);
      component.removeFriend(zoe);

      expect(info.mock.calls.map((call) => call[0])).toEqual([
        'Demande annulée',
        'Zoé est maintenant votre ami',
        'Demande refusée',
        'Zoé a été retiré de vos amis',
      ]);
    });

    it('signale une action refusee', async () => {
      const component = await build([
        directory(me),
        override(FriendService, {
          sendRequest: () => throwError(() => new Error('Trop de demandes')),
        }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.sendRequest(zoe);

      expect(error).toHaveBeenCalledWith('Trop de demandes');
    });

    it('reste comprehensible quand le refus n a pas de message', async () => {
      const component = await build([
        directory(me),
        override(FriendService, {
          sendRequest: () => throwError(() => ({}) as Error),
        }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.sendRequest(zoe);

      expect(error).toHaveBeenCalledWith('Action impossible');
    });

    it('tait un refus d ecriture du a une deconnexion', async () => {
      const component = await build([
        directory(me),
        override(FriendService, {
          sendRequest: () =>
            throwError(() => new Error('Missing or insufficient permissions.')),
        }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.sendRequest(zoe);

      expect(error).not.toHaveBeenCalled();
    });
  });
});
