import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Player } from '../../core/interfaces/player';
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

  function build(player: Player) {
    saved = undefined;
    const currentPlayerSig = signal<Player | null | undefined>(player);

    TestBed.configureTestingModule({
      imports: [PrivacyCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
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
          useValue: { handleError: () => undefined },
        },
      ],
    });

    const fixture = TestBed.createComponent(PrivacyCardComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, currentPlayerSig };
  }

  beforeEach(() => {
    shouldFail = false;
  });

  afterEach(() => TestBed.resetTestingModule());

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
});
