import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  overrideProvider as override,
} from '../../testing/test-providers';
import { Player } from '../core/interfaces/player';
import {
  LocalStorageService,
  MedalsSnapshot,
} from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RankingComponent } from './ranking.component';

const stats = (motus: number, drapeaux: number) => [
  { gameName: 'motus', medalsNumber: motus, lastSuccessRetrieved: 0 },
  { gameName: 'drapeaux', medalsNumber: drapeaux, lastSuccessRetrieved: 0 },
];

const me = buildPlayer({
  id: 'p1',
  userId: 'u1',
  username: 'Moi',
  stats: stats(5, 5),
});
const ami = buildPlayer({
  id: 'p2',
  userId: 'u2',
  username: 'Ami',
  stats: stats(20, 1),
});
const inconnu = buildPlayer({
  id: 'p3',
  userId: 'u3',
  username: 'Inconnu',
  stats: stats(100, 100),
});

/** Le joueur courant et l'annuaire complet, tels que la page les lit. */
const withPlayers = (player: Player, all = [me, ami, inconnu]): Provider =>
  override(PlayerService, {
    currentPlayerSig: signal(player),
    getAllPlayers: () => of(all),
  });

describe('RankingComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<RankingComponent> {
    await TestBed.configureTestingModule({
      imports: [RankingComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(RankingComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('progression depuis la derniere visite', () => {
    const storage = (snapshot: MedalsSnapshot | null) => {
      const save = vi.fn();
      return {
        save,
        provider: override(LocalStorageService, {
          getMedalsSnapshot: () => snapshot,
          saveMedalsSnapshot: save,
        }),
      };
    };

    it('ne montre rien a la premiere visite, et retient les medailles', async () => {
      const { save, provider } = storage(null);
      const component = await build([withPlayers(me), provider]);

      expect(component.gains()).toEqual({});
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          u1: expect.objectContaining({ motus: 5, drapeaux: 5 }),
        }),
      );
    });

    it('explique la montee par le total gagne et le jeu qui a le plus rapporte', async () => {
      const { provider } = storage({
        u1: { motus: 4, drapeaux: 2 },
        u2: { motus: 20, drapeaux: 1 },
      });
      const component = await build([withPlayers(me), provider]);

      expect(component.gains()['u1']).toEqual({ medals: 4, game: 'Drapeaux' });
      // Rien de gagne, ou absent a la visite precedente : pas de mention.
      expect(component.gains()['u2']).toBeUndefined();
      expect(component.gains()['u3']).toBeUndefined();
    });

    it('ne compte que le jeu choisi', async () => {
      const { provider } = storage({ u1: { motus: 4, drapeaux: 2 } });
      const component = await build([withPlayers(me), provider]);

      component.gameSelected.set('motus');
      expect(component.gains()['u1']).toEqual({ medals: 1, game: '' });

      component.gameSelected.set('marques');
      expect(component.gains()['u1']).toBeUndefined();
    });
  });

  describe('perimetre du classement', () => {
    it('ouvre sur les amis quand le joueur en a', async () => {
      const component = await build([
        withPlayers({ ...me, friendIds: ['u2'] }),
      ]);

      expect(component.hasFriends()).toBe(true);
      expect(component.scope()).toBe('amis');
      expect(component.sortedPlayers().map((player) => player.id)).toEqual([
        'p2',
        'p1',
      ]);
      expect(component.loading()).toBe(false);
    });

    it('bascule sur le classement global sans ami', async () => {
      const component = await build([withPlayers(me)]);

      expect(component.hasFriends()).toBe(false);
      expect(component.scope()).toBe('tous');
      expect(component.sortedPlayers().length).toBe(3);
    });

    it('montre tout le monde quand le joueur elargit', async () => {
      const component = await build([
        withPlayers({ ...me, friendIds: ['u2'] }),
      ]);

      component.scope.set('tous');

      expect(component.sortedPlayers().map((player) => player.id)).toEqual([
        'p3',
        'p2',
        'p1',
      ]);
    });

    it('signale un echec de chargement', async () => {
      const component = await build([
        override(PlayerService, {
          getAllPlayers: () => throwError(() => new Error('refus')),
        }),
      ]);
      expect(component.loading()).toBe(false);
      expect(component.sortedPlayers()).toEqual([]);
    });
  });

  describe('classement', () => {
    it('classe sur le total des medailles par defaut', async () => {
      const component = await build([withPlayers(me)]);

      expect(component.gameSelected()).toBe('general');
      expect(component.sortedPlayers().map((player) => player.id)).toEqual([
        'p3',
        'p2',
        'p1',
      ]);
    });

    it('reclasse sur le jeu choisi', async () => {
      const component = await build([
        withPlayers({ ...me, friendIds: ['u2'] }),
      ]);

      component.gameSelected.set('drapeaux');

      expect(component.sortedPlayers().map((player) => player.id)).toEqual([
        'p1',
        'p2',
      ]);
    });

    it('donne la place du joueur pour chaque jeu', async () => {
      const component = await build([
        withPlayers({ ...me, friendIds: ['u2'] }),
      ]);

      expect(component.currentPlayerPosition()).toBe(2);
      expect(component.positions()['general']).toBe('(2ème / 2)');
      expect(component.positions()['drapeaux']).toBe('(1er / 2)');
    });

    it('ne place pas un visiteur absent du classement', async () => {
      const component = await build([
        override(PlayerService, {
          currentPlayerSig: signal(null),
          getAllPlayers: () => of([ami, inconnu]),
        }),
      ]);

      expect(component.currentPlayerPosition()).toBeUndefined();
      expect(component.positions()['general']).toBe('');
    });

    it('compte zero pour un jeu jamais joue', async () => {
      const component = await build([
        withPlayers({ ...me, friendIds: ['u2'] }, [{ ...me, stats: [] }, ami]),
      ]);

      component.gameSelected.set('capitales');

      expect(component.sortedPlayers().length).toBe(2);
    });
  });

  describe('pagination', () => {
    // 25 joueurs, du plus titre (x0, 25 medailles) au moins titre (x24, 1).
    const crowd = Array.from({ length: 25 }, (_, index) =>
      buildPlayer({
        id: `x${index}`,
        userId: `ux${index}`,
        username: `Joueur ${index}`,
        stats: stats(25 - index, 0),
      }),
    );
    const meAt = (index: number) => crowd[index];

    it('decoupe le classement par pages de 10', async () => {
      const component = await build([withPlayers(meAt(0), crowd)]);

      expect(component.pageCount()).toBe(3);
      expect(component.page()).toBe(1);
      expect(component.pagedPlayers().map((player) => player.id)).toEqual(
        crowd.slice(0, 10).map((player) => player.id),
      );
    });

    it('ouvre sur la page du joueur courant', async () => {
      const component = await build([withPlayers(meAt(14), crowd)]);

      expect(component.currentPlayerPosition()).toBe(15);
      expect(component.page()).toBe(2);
      expect(component.pageStart()).toBe(10);
      expect(component.pagedPlayers()).toContain(meAt(14));
    });

    it('navigue entre les pages sans sortir des bornes', async () => {
      const component = await build([withPlayers(meAt(0), crowd)]);

      component.goToPage(3);
      expect(component.pagedPlayers().map((player) => player.id)).toEqual(
        crowd.slice(20).map((player) => player.id),
      );

      component.goToPage(9);
      expect(component.page()).toBe(3);

      component.goToPage(0);
      expect(component.page()).toBe(1);
    });

    it('revient a la position du joueur', async () => {
      const component = await build([withPlayers(meAt(24), crowd)]);

      component.goToPage(1);
      expect(component.page()).toBe(1);

      component.goToCurrentPlayer();
      expect(component.page()).toBe(3);
    });

    it('se recale sur le joueur quand le jeu change', async () => {
      const component = await build([withPlayers(meAt(0), crowd)]);

      component.goToPage(3);
      // Tout le monde a 0 en drapeaux : l'ordre initial est conserve.
      component.gameSelected.set('drapeaux');

      expect(component.page()).toBe(1);
    });

    it('n affiche qu une page pour un petit classement', async () => {
      const component = await build([withPlayers(me)]);

      expect(component.pageCount()).toBe(1);
      expect(component.pagedPlayers().length).toBe(3);
    });
  });

  it('bascule entre classement et succes', async () => {
    const component = await build([withPlayers(me)]);

    expect(component.tab()).toBe('classement');

    component.tab.set('succes');

    expect(component.tab()).toBe('succes');
  });
});
