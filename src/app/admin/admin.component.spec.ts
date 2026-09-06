import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../testing/test-providers';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { AdminComponent } from './admin.component';

const alice = buildPlayer({
  id: 'p1',
  userId: 'u1',
  username: 'Alice',
  stats: [{ gameName: 'motus', medalsNumber: 10, lastSuccessRetrieved: 0 }],
});

const bob = buildPlayer({
  id: 'p2',
  userId: 'u2',
  username: 'Bob',
  stats: [{ gameName: 'motus', medalsNumber: 2, lastSuccessRetrieved: 0 }],
});

/** Une page peuplee : sous deux joueurs, la page reste en chargement. */
const populated = (rooms = [buildRoom()]): Provider[] => [
  override(RoomService, { getRooms: () => of(rooms) }),
  override(PlayerService, { getAllPlayers: () => of([alice, bob]) }),
];

describe('AdminComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<AdminComponent> {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /** Fenetre modale rendue sans l'ouvrir : seule sa reponse compte. */
  function stubDialog(component: AdminComponent, answer: unknown) {
    return vi
      .spyOn(component.dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(answer) } as never);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('patiente tant qu il n y a pas de quoi remplir la page', async () => {
    const component = await build();

    expect(component.loading()).toBe(true);
  });

  describe('chargement', () => {
    it('recense rooms, joueurs et occupants', async () => {
      const rooms = [
        buildRoom({ id: 'r1', playerIds: ['u1', 'u2'] }),
        buildRoom({ id: 'r2', isStarted: true, playerIds: ['u1'] }),
      ];
      const component = await build(populated(rooms));

      expect(component.loading()).toBe(false);
      expect(component.rooms().map((room) => room.id)).toEqual(['r2', 'r1']);
      expect(component.startedRoomsNumber()).toBe(1);
      expect(component.waitingRoomsNumber()).toBe(1);
      expect(component.playersByRoom()['r1'].map((p) => p.id)).toEqual([
        'p1',
        'p2',
      ]);
      expect(component.playersByRoom()['r2'].map((p) => p.id)).toEqual(['p1']);
    });

    it('ignore les identifiants sans joueur connu', async () => {
      const component = await build(
        populated([buildRoom({ id: 'r1', playerIds: ['fantome'] })]),
      );

      expect(component.playersByRoom()['r1']).toEqual([]);
    });

    it('accepte une room sans liste de participants', async () => {
      const component = await build(
        populated([buildRoom({ id: 'r1', playerIds: undefined as never })]),
      );

      expect(component.playersByRoom()['r1']).toEqual([]);
    });

    it('signale un echec de chargement', async () => {
      const component = await build([
        override(RoomService, {
          getRooms: () => throwError(() => new Error('refus')),
        }),
      ]);

      expect(component.loading()).toBe(false);
    });
  });

  describe('tris', () => {
    it('place les parties en cours devant, puis les rooms les plus peuplees', async () => {
      const component = await build();

      const sorted = component.sortRooms([
        buildRoom({ id: 'seule', playerIds: ['u1'] }),
        buildRoom({ id: 'lancee', isStarted: true }),
        buildRoom({ id: 'peuplee', playerIds: ['u1', 'u2'] }),
        buildRoom({ id: 'vide', playerIds: undefined as never }),
      ]);

      expect(sorted.map((room) => room.id)).toEqual([
        'lancee',
        'peuplee',
        'seule',
        'vide',
      ]);
    });

    it('classe les joueurs par medailles puis par pseudo', async () => {
      const component = await build();

      const sorted = component.sortPlayers([
        buildPlayer({ id: 'zoe', username: 'Zoé', stats: [] }),
        buildPlayer({ id: 'alice', username: 'Alice', stats: [] }),
        alice,
        buildPlayer({
          id: 'sans-stats',
          username: 'Sans',
          stats: undefined as never,
        }),
        buildPlayer({
          id: 'stat-vide',
          username: 'Vide',
          stats: [{ gameName: 'motus', lastSuccessRetrieved: 0 } as never],
        }),
      ]);

      expect(sorted.map((player) => player.id)).toEqual([
        'p1',
        'alice',
        'sans-stats',
        'stat-vide',
        'zoe',
      ]);
    });
  });

  describe('recherche de joueur', () => {
    it('rend tous les joueurs quand la recherche est vide', async () => {
      const component = await build(populated());

      expect(component.filteredPlayers().length).toBe(2);
    });

    it('filtre sur le pseudo, sans casse ni accent', async () => {
      const component = await build(populated());

      component.playerSearchControl.setValue('  ALI ');

      expect(component.filteredPlayers().map((player) => player.id)).toEqual([
        'p1',
      ]);
    });

    it('accepte une recherche remise a zero', async () => {
      const component = await build(populated());

      component.playerSearchControl.setValue(null);

      expect(component.filteredPlayers().length).toBe(2);
    });
  });

  describe('suppression de room', () => {
    it('supprime apres confirmation', async () => {
      const component = await build(populated());
      stubDialog(component, true);
      const deleteRoom = vi.spyOn(component.roomService, 'deleteRoom');
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.deleteRoom('r1');

      expect(deleteRoom).toHaveBeenCalledWith('r1');
      expect(info).toHaveBeenCalledWith('La room a été supprimée', 'Room');
      expect(component.loading()).toBe(false);
    });

    it('ne supprime rien sans confirmation', async () => {
      const component = await build(populated());
      stubDialog(component, false);
      const deleteRoom = vi.spyOn(component.roomService, 'deleteRoom');

      component.deleteRoom('r1');

      expect(deleteRoom).not.toHaveBeenCalled();
    });

    it('signale un refus de suppression', async () => {
      const component = await build(populated());
      stubDialog(component, true);
      vi.spyOn(component.roomService, 'deleteRoom').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.deleteRoom('r1');

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  describe('menage des rooms inactives', () => {
    async function withStaleRooms(): Promise<AdminComponent> {
      return build([
        ...populated([buildRoom({ id: 'r1' }), buildRoom({ id: 'r2' })]),
        override(RoomService, {
          getRooms: () =>
            of([buildRoom({ id: 'r1' }), buildRoom({ id: 'r2' })]),
          isStale: () => true,
        }),
      ]);
    }

    it('ne propose rien quand aucune room n est inactive', async () => {
      const component = await build(populated());
      const open = vi.spyOn(component.dialog, 'open');

      component.purgeStaleRooms();

      expect(component.staleRooms()).toEqual([]);
      expect(open).not.toHaveBeenCalled();
    });

    it('supprime les rooms inactives une a une', async () => {
      const component = await withStaleRooms();
      stubDialog(component, true);
      const deleteRoom = vi.spyOn(component.roomService, 'deleteRoom');
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.purgeStaleRooms();

      expect(deleteRoom).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenCalledWith('2 rooms supprimées', 'Rooms');
      expect(component.loading()).toBe(false);
    });

    it('ne supprime rien sans confirmation', async () => {
      const component = await withStaleRooms();
      stubDialog(component, false);
      const deleteRoom = vi.spyOn(component.roomService, 'deleteRoom');

      component.purgeStaleRooms();

      expect(deleteRoom).not.toHaveBeenCalled();
    });

    it('signale un refus de menage', async () => {
      const component = await withStaleRooms();
      stubDialog(component, true);
      vi.spyOn(component.roomService, 'deleteRoom').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.purgeStaleRooms();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  describe('modification d un joueur', () => {
    it('enregistre la fiche renvoyee par la fenetre', async () => {
      const component = await build(populated());
      stubDialog(component, { ...bob, username: 'Bobby' });
      const update = vi.spyOn(component.playerService, 'updatePlayer');
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.openUserDialog(bob);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'Bobby' }),
      );
      expect(info).toHaveBeenCalledWith('Joueur modifié', 'Joueur');
    });

    it('ne modifie rien quand la fenetre est fermee', async () => {
      const component = await build(populated());
      stubDialog(component, null);
      const update = vi.spyOn(component.playerService, 'updatePlayer');

      component.openUserDialog(bob);

      expect(update).not.toHaveBeenCalled();
    });

    it('signale un refus de modification', async () => {
      const component = await build(populated());
      stubDialog(component, bob);
      vi.spyOn(component.playerService, 'updatePlayer').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.openUserDialog(bob);

      expect(handleError).toHaveBeenCalled();
    });
  });

  it('rejoint une room comme n importe quel joueur', async () => {
    const component = await build(populated());
    const newGame = vi.spyOn(component.localStorageService, 'newGame');
    const navigate = vi
      .spyOn(component.router, 'navigate')
      .mockResolvedValue(true);

    component.joinRoom('r1');

    expect(newGame).toHaveBeenCalledWith('r1');
    expect(navigate).toHaveBeenCalledWith(['/room', 'r1']);
  });

  it('annonce l absence de resultat de recherche', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: appTestProviders(populated()),
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
    fixture.componentInstance.playerSearchControl.setValue('personne');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aucun joueur trouvé',
    );
  });
});
