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
import { GameApiService } from '../core/services/game-api.service';
import { PlayerService } from '../core/services/player.service';
import { SuccessComponent } from './success.component';

/** Le joueur, sa fiche de stats et le flux qui debloque l'affichage. */
const withPlayer = (player: Player | null): Provider =>
  override(PlayerService, {
    currentPlayerSig: signal(player),
    playerReady$: of(player),
  });

describe('SuccessComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<SuccessComponent> {
    await TestBed.configureTestingModule({
      imports: [SuccessComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(SuccessComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('rend la main des que la fiche joueur est connue', async () => {
    const component = await build();

    expect(component.loading()).toBe(false);
    expect(component.gameSelected()).toBe('drapeaux');
  });

  it('signale un echec de chargement de la fiche', async () => {
    const component = await build([
      override(PlayerService, {
        playerReady$: throwError(() => new Error('refus')),
      }),
    ]);

    expect(component.loading()).toBe(false);
  });

  describe('medailles', () => {
    it('lit les medailles du jeu affiche', async () => {
      const component = await build();

      expect(component.currentMedals()).toBe(2);

      component.gameSelected.set('motus');
      expect(component.currentMedals()).toBe(3);
    });

    it('compte zero pour un jeu jamais joue, ou sans fiche', async () => {
      const component = await build();

      expect(component.medalsFor('capitales')).toBe(0);

      component.playerService.currentPlayerSig.set(null);
      expect(component.currentMedals()).toBe(0);
      expect(component.medalsFor('motus')).toBe(0);
    });
  });

  describe('paliers', () => {
    it('mesure l avancee vers chaque palier', async () => {
      const component = await build([
        withPlayer(
          buildPlayer({
            stats: [
              { gameName: 'motus', medalsNumber: 5, lastSuccessRetrieved: 0 },
            ],
          }),
        ),
      ]);
      component.gameSelected.set('motus');

      const [first] = component.visibleGoals();

      expect(first.goal.target).toBe(10);
      expect(first.progress).toBe(50);
      expect(first.isReached).toBe(false);
      expect(first.isClaimable).toBe(false);
    });

    it('ne rend reclamable que le premier palier atteint', async () => {
      const component = await build([
        withPlayer(
          buildPlayer({
            stats: [
              { gameName: 'motus', medalsNumber: 30, lastSuccessRetrieved: 0 },
            ],
          }),
        ),
      ]);
      component.gameSelected.set('motus');

      const reached = component
        .visibleGoals()
        .filter((entry) => entry.isReached);

      expect(reached.map((entry) => entry.goal.target)).toEqual([10, 25]);
      expect(reached.filter((entry) => entry.isClaimable).length).toBe(1);
      expect(reached[0].isClaimable).toBe(true);
    });

    it('masque les paliers deja recuperes', async () => {
      const component = await build([
        withPlayer(
          buildPlayer({
            stats: [
              { gameName: 'motus', medalsNumber: 30, lastSuccessRetrieved: 25 },
            ],
          }),
        ),
      ]);
      component.gameSelected.set('motus');

      expect(component.visibleGoals()[0].goal.target).toBe(50);
    });

    it('part de zero pour un jeu sans fiche de stats', async () => {
      const component = await build([withPlayer(buildPlayer({ stats: [] }))]);

      expect(component.visibleGoals()[0].progress).toBe(0);
    });
  });

  describe('recuperation d un succes', () => {
    it('enregistre le palier et les medailles renvoyees', async () => {
      const component = await build([
        withPlayer(
          buildPlayer({
            stats: [
              {
                gameName: 'drapeaux',
                medalsNumber: 10,
                lastSuccessRetrieved: 0,
              },
            ],
          }),
        ),
        override(GameApiService, {
          claimGoal: () => of({ reward: 1, medalsNumber: 11 }),
        }),
      ]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.getSuccess({ target: 10, reward: 1 });

      const stat = component.playerService.currentPlayerSig()!.stats[0];
      expect(stat.lastSuccessRetrieved).toBe(10);
      expect(stat.medalsNumber).toBe(11);
      expect(info).toHaveBeenCalledWith('Succès récupéré', 'Succès');
    });

    it('ne demande rien sans fiche ni statistique pour ce jeu', async () => {
      const component = await build([withPlayer(buildPlayer({ stats: [] }))]);
      const claim = vi.spyOn(component.gameApi, 'claimGoal');

      component.getSuccess({ target: 10, reward: 1 });

      component.playerService.currentPlayerSig.set(null);
      component.getSuccess({ target: 10, reward: 1 });

      expect(claim).not.toHaveBeenCalled();
    });

    it('signale un refus du serveur', async () => {
      const component = await build([
        override(GameApiService, {
          claimGoal: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.getSuccess({ target: 10, reward: 1 });

      expect(handleError).toHaveBeenCalled();
    });
  });
});
