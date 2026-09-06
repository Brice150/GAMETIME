import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApiService } from './game-api.service';

// `httpsCallable` fabrique la fonction appelee : on la remplace au niveau du module pour observer
// le nom demande et la charge envoyee, sans reseau ni projet Firebase.
const callable = vi.fn((payload: Record<string, unknown>) =>
  Promise.resolve({ data: { echo: payload } as unknown }),
);
const httpsCallable = vi.fn((_functions: unknown, name: string) => {
  lastName = name;
  return callable;
});
let lastName = '';

vi.mock('@angular/fire/functions', () => ({
  Functions: class {},
  httpsCallable: (functions: unknown, name: string) =>
    httpsCallable(functions, name),
}));

describe('GameApiService', () => {
  let service: GameApiService;

  /** La charge envoyee a la derniere fonction appelee. */
  function sent(): Record<string, unknown> {
    return callable.mock.lastCall![0];
  }

  beforeEach(() => {
    callable.mockClear();
    httpsCallable.mockClear();
    lastName = '';
    TestBed.configureTestingModule({
      providers: [{ provide: Functions, useValue: {} }],
    });
    service = TestBed.inject(GameApiService);
  });

  it('soumet une manche au serveur, qui seul tranche', async () => {
    const verdict = {
      won: true,
      currentRoomWins: [true],
      finished: false,
      medalsNumber: 4,
    };
    callable.mockResolvedValueOnce({ data: verdict });

    const result = await new Promise((resolve) =>
      service.submitRound('r1', 2, 'CHAT', 1200).subscribe(resolve),
    );

    expect(lastName).toBe('submitRound');
    expect(sent()).toEqual({
      roomId: 'r1',
      stepIndex: 2,
      answer: 'CHAT',
      durationMs: 1200,
    });
    expect(result).toBe(verdict);
  });

  it('accepte une manche sans duree mesuree', async () => {
    await new Promise((resolve) =>
      service.submitRound('r1', 0, 'CHAT', null).subscribe(resolve),
    );

    expect(sent()['durationMs']).toBeNull();
  });

  it('reclame un palier et rend la recompense', async () => {
    const reward = { reward: 3, medalsNumber: 12 };
    callable.mockResolvedValueOnce({ data: reward });

    const result = await new Promise((resolve) =>
      service.claimGoal('motus', 10).subscribe(resolve),
    );

    expect(lastName).toBe('claimGoal');
    expect(sent()).toEqual({ gameName: 'motus', target: 10 });
    expect(result).toBe(reward);
  });

  it('transmet une action d amitie et ne rend rien', async () => {
    callable.mockResolvedValueOnce({ data: { ok: true } });

    const result = await new Promise<unknown>((resolve) =>
      service
        .manageFriendship('accept', 'u2')
        .subscribe((value) => resolve(value)),
    );

    expect(lastName).toBe('manageFriendship');
    expect(sent()).toEqual({ action: 'accept', targetUserId: 'u2' });
    expect(result).toBeUndefined();
  });

  it('rattache un compte invite et dit s il a ete migre', async () => {
    callable.mockResolvedValueOnce({ data: { migrated: true } });

    const result = await new Promise((resolve) =>
      service.linkGuestAccount('jeton').subscribe(resolve),
    );

    expect(lastName).toBe('linkGuestAccount');
    expect(sent()).toEqual({ guestIdToken: 'jeton' });
    expect(result).toEqual({ migrated: true });
  });
});
