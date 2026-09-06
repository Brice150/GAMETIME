import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  overrideProvider as override,
} from '../../testing/test-providers';
import { Player } from '../core/interfaces/player';
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

  it('bascule entre classement et succes', async () => {
    const component = await build([withPlayers(me)]);

    expect(component.tab()).toBe('classement');

    component.tab.set('succes');

    expect(component.tab()).toBe('succes');
  });
});
