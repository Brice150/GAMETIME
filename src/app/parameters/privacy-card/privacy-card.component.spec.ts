import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Player } from '../../core/interfaces/player';
import { GameApiService } from '../../core/services/game-api.service';
import { PlayerService } from '../../core/services/player.service';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';
import { PrivacyCardComponent } from './privacy-card.component';

function buildPlayer(shareActivity?: boolean): Player {
  return {
    id: 'p1',
    userId: 'u1',
    username: 'Test',
    animal: '🐱',
    isAdmin: false,
    stats: [],
    currentRoomWins: [],
    finishDate: null,
    durationMs: null,
    isReady: false,
    shareActivity,
  };
}

describe('PrivacyCardComponent', () => {
  let saved: Partial<Player> | undefined;
  let shouldFail = false;
  const handleError = vi.fn();
  const exportMyData = vi.fn(() => of<Record<string, unknown>>({ a: 1 }));

  function build(player: Player) {
    saved = undefined;
    const currentPlayerSig = signal<Player | null | undefined>(player);

    TestBed.configureTestingModule({
      imports: [PrivacyCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: GameApiService, useValue: { exportMyData } },
        {
          provide: PlayerService,
          useValue: {
            currentPlayerSig,
            updatePlayerFields: (_id: string, fields: Partial<Player>) => {
              saved = fields;
              return shouldFail
                ? throwError(() => new Error('refus'))
                : of(undefined);
            },
          },
        },
        {
          provide: ToastrHelperService,
          useValue: { handleError },
        },
      ],
    });

    const fixture = TestBed.createComponent(PrivacyCardComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, currentPlayerSig };
  }

  beforeEach(() => {
    shouldFail = false;
    handleError.mockClear();
    exportMyData.mockClear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    const url = URL as unknown as Record<string, unknown>;
    delete url['createObjectURL'];
    delete url['revokeObjectURL'];
  });

  it('considere une fiche sans reglage comme visible', () => {
    const { component } = build(buildPlayer(undefined));

    expect(component.shareActivity()).toBe(true);
  });

  it('respecte un reglage desactive', () => {
    const { component } = build(buildPlayer(false));

    expect(component.shareActivity()).toBe(false);
  });

  it('enregistre la bascule', () => {
    const { component } = build(buildPlayer(true));

    component.toggle(false);

    expect(saved).toEqual({ shareActivity: false });
    expect(component.shareActivity()).toBe(false);
  });

  it('revient en arriere si l enregistrement echoue', () => {
    shouldFail = true;
    const { component } = build(buildPlayer(true));

    component.toggle(false);

    expect(component.shareActivity()).toBe(true);
  });

  it('ne bascule rien sans fiche joueur', () => {
    const { component, currentPlayerSig } = build(buildPlayer(true));
    currentPlayerSig.set(null);

    component.toggle(false);

    expect(saved).toBeUndefined();
  });

  describe('export des donnees', () => {
    it('telecharge la copie rendue par le serveur', () => {
      const { component } = build(buildPlayer(true));
      const createUrl = vi.fn(() => 'blob:export');
      const revokeUrl = vi.fn();
      // jsdom ne fournit pas ces deux methodes : elles sont posees puis
      // retirees apres le test.
      Object.assign(URL, {
        createObjectURL: createUrl,
        revokeObjectURL: revokeUrl,
      });
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);

      component.exportData();

      expect(exportMyData).toHaveBeenCalled();
      expect(createUrl).toHaveBeenCalled();
      const link = click.mock.contexts[0] as HTMLAnchorElement;
      expect(link.download).toMatch(
        /^game-time-mes-donnees-\d{4}-\d{2}-\d{2}\.json$/,
      );
      expect(revokeUrl).toHaveBeenCalledWith('blob:export');
      expect(component.exporting()).toBe(false);
    });

    it('signale un echec d export', () => {
      exportMyData.mockReturnValueOnce(throwError(() => new Error('refus')));
      const { component } = build(buildPlayer(true));

      component.exportData();

      expect(handleError).toHaveBeenCalled();
      expect(component.exporting()).toBe(false);
    });
  });
});
