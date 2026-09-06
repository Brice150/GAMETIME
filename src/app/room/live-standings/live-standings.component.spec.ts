import { EnvironmentProviders, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../../testing/test-providers';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { LiveStandingsComponent } from './live-standings.component';

describe('LiveStandingsComponent', () => {
  async function buildFixture(
    players: Player[] = [buildPlayer()],
    room: Room = buildRoom(),
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<ComponentFixture<LiveStandingsComponent>> {
    await TestBed.configureTestingModule({
      imports: [LiveStandingsComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(LiveStandingsComponent);
    fixture.componentRef.setInput('room', room);
    fixture.componentRef.setInput('players', players);
    fixture.componentRef.setInput('currentPlayerId', 'u1');
    fixture.detectChanges();
    return fixture;
  }

  async function build(
    players?: Player[],
    room?: Room,
    extra?: (Provider | EnvironmentProviders)[],
  ): Promise<LiveStandingsComponent> {
    return (await buildFixture(players, room, extra)).componentInstance;
  }

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('classement provisoire', () => {
    it('numerote les joueurs et compte leurs manches gagnees', async () => {
      const component = await build([
        buildPlayer({ id: 'p1', userId: 'u1', currentRoomWins: [true, false] }),
        buildPlayer({ id: 'p2', userId: 'u2', currentRoomWins: [true, true] }),
      ]);

      expect(component.standings()).toMatchObject([
        { rank: 1, wins: 1, step: 3, total: 3, isMe: true },
        { rank: 2, wins: 2, step: 3, total: 3, isMe: false },
      ]);
    });

    it('borne la manche affichee au nombre de manches de la partie', async () => {
      const component = await build([
        buildPlayer({ currentRoomWins: [true, true, true] }),
      ]);

      expect(component.standings()[0].step).toBe(3);
    });

    it('compte zero manche sur une room sans questions', async () => {
      const component = await build(
        [buildPlayer()],
        buildRoom({ responses: undefined as never }),
      );

      expect(component.standings()[0].total).toBe(0);
    });

    it('annonce les lettres trouvees de la manche en cours', async () => {
      const component = await build([
        buildPlayer({
          currentRoundProgress: {
            stepIndex: 0,
            lettersFound: 2,
            lettersTotal: 5,
          },
        }),
      ]);

      expect(component.standings()[0].lettersLabel).toBe('2/5 lettres');
    });

    it('n annonce aucune lettre pour une manche passee, finie ou vide', async () => {
      const component = await build([
        buildPlayer({
          id: 'p1',
          currentRoundProgress: {
            stepIndex: 1,
            lettersFound: 2,
            lettersTotal: 5,
          },
        }),
        buildPlayer({
          id: 'p2',
          userId: 'u2',
          finishDate: new Date(),
          currentRoundProgress: {
            stepIndex: 0,
            lettersFound: 2,
            lettersTotal: 5,
          },
        }),
        buildPlayer({
          id: 'p3',
          userId: 'u3',
          currentRoundProgress: {
            stepIndex: 0,
            lettersFound: 0,
            lettersTotal: 0,
          },
        }),
        buildPlayer({ id: 'p4', userId: 'u4' }),
      ]);

      expect(component.standings().map((entry) => entry.lettersLabel)).toEqual([
        null,
        null,
        null,
        null,
      ]);
    });
  });

  describe('chrono', () => {
    it('prend le chrono local quand il existe', async () => {
      const component = await build(undefined, undefined, [
        override(LocalStorageService, { getElapsedMs: () => 4200 }),
      ]);

      expect(component.elapsedMs()).toBe(4200);
    });

    it('retombe sur l heure de lancement de la room', async () => {
      const component = await build(
        undefined,
        buildRoom({ startDate: new Date(Date.now() - 5000) }),
      );

      expect(component.elapsedMs()).toBeGreaterThanOrEqual(5000);
    });

    it('lit une heure de lancement au format Firestore', async () => {
      const component = await build(
        undefined,
        buildRoom({
          startDate: Timestamp.fromDate(
            new Date(Date.now() - 5000),
          ) as unknown as Date,
        }),
      );

      expect(component.elapsedMs()).toBeGreaterThanOrEqual(5000);
    });

    it('n affiche aucun temps sur une room jamais lancee', async () => {
      const component = await build(undefined, buildRoom({ startDate: null }));

      expect(component.elapsedMs()).toBeNull();
    });

    it('avance dix fois par seconde', async () => {
      vi.useFakeTimers();
      let elapsed = 1000;
      const component = await build(undefined, undefined, [
        override(LocalStorageService, { getElapsedMs: () => elapsed }),
      ]);

      elapsed = 1100;
      vi.advanceTimersByTime(100);

      expect(component.elapsedMs()).toBe(1100);
    });
  });
});
