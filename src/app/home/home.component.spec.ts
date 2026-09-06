import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildRoom,
  overrideProvider as override,
} from '../../testing/test-providers';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<HomeComponent> {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('propose les jeux ranges par categorie', async () => {
    const component = await build();

    expect(component.gameGroups.length).toBeGreaterThan(0);
    expect(component.gameGroups[0].games.length).toBeGreaterThan(0);
  });

  describe('creation de partie', () => {
    it('cree une room et y entre', async () => {
      const component = await build();
      const deleteRooms = vi.spyOn(component.roomService, 'deleteUserRooms');
      const addRoom = vi.spyOn(component.roomService, 'addRoom');
      const newGame = vi.spyOn(component.localStorageService, 'newGame');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);

      component.play();

      // Les rooms precedentes partent : un joueur n'en tient qu'une.
      expect(deleteRooms).toHaveBeenCalled();
      expect(addRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          gameName: '',
          playerIds: ['u1'],
          roomCode: 'ABCD',
        }),
      );
      expect(newGame).toHaveBeenCalledWith('r1');
      expect(navigate).toHaveBeenCalledWith(['/room/r1']);
      expect(component.loading()).toBe(false);
    });

    it('refuse de creer une room sans joueur identifie', async () => {
      const component = await build([
        override(PlayerService, { currentPlayerSig: signal(null) }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');
      const deleteRooms = vi.spyOn(component.roomService, 'deleteUserRooms');

      component.play();

      expect(error).toHaveBeenCalledWith('Utilisateur introuvable');
      expect(deleteRooms).not.toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });

    it('signale un echec de creation', async () => {
      const component = await build();
      vi.spyOn(component.roomService, 'deleteUserRooms').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.play();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  describe('entree par code', () => {
    it('entre dans la room qui porte le code', async () => {
      const component = await build([
        override(RoomService, {
          getRoomsByCode: () => of([buildRoom({ id: 'r7' })]),
        }),
      ]);
      const newGame = vi.spyOn(component.localStorageService, 'newGame');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);

      component.joinRoom('ABCD');

      expect(newGame).toHaveBeenCalledWith('r7');
      expect(navigate).toHaveBeenCalledWith(['/room/r7']);
      expect(component.loading()).toBe(false);
    });

    it('previent qu une partie est deja en cours', async () => {
      const component = await build([
        override(RoomService, {
          getRoomsByCode: () => of([buildRoom({ id: 'r7', isStarted: true })]),
        }),
      ]);
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.joinRoom('ABCD');

      expect(info).toHaveBeenCalledWith(
        'La partie est déjà en cours, vous la rejoignez en route',
        'Room',
      );
    });

    it('signale un code sans room', async () => {
      const component = await build();
      const error = vi.spyOn(component.toastrHelper, 'error');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);

      component.joinRoom('ZZZZ');

      expect(error).toHaveBeenCalledWith('Aucune room trouvée avec ce code');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('signale un echec de recherche', async () => {
      const component = await build([
        override(RoomService, {
          getRoomsByCode: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.joinRoom('ABCD');

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });
});
