import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { UserService } from './user.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let currentUser: { uid: string } | null;

  function build(): LocalStorageService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: {
            auth: {
              get currentUser() {
                return currentUser;
              },
            },
          },
        },
      ],
    });
    return TestBed.inject(LocalStorageService);
  }

  beforeEach(() => {
    localStorage.clear();
    currentUser = { uid: 'u1' };
    service = build();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('range les essais sous la cle du compte connecte', () => {
    service.saveTries([{ word: 'CHAT', letters: [] } as never]);

    expect(localStorage.getItem('tries:u1')).not.toBeNull();
    expect(service.getTries()).toEqual([{ word: 'CHAT', letters: [] }]);
  });

  it('ne rend pas a un compte les essais d un autre', () => {
    service.saveTries([{ word: 'CHAT' } as never]);

    currentUser = { uid: 'u2' };

    expect(service.getTries()).toBeNull();
  });

  it('range sous anonyme quand personne n est connecte', () => {
    currentUser = null;

    service.saveRoomId('r1');

    expect(localStorage.getItem('roomId:anonymous')).toBe('r1');
    expect(service.getRoomId()).toBe('r1');
  });

  it('rend null plutot qu une exception sur des essais illisibles', () => {
    localStorage.setItem('tries:u1', '{ pas du json');

    expect(service.getTries()).toBeNull();
  });

  it('rend null quand rien n a ete range', () => {
    expect(service.getTries()).toBeNull();
    expect(service.getRoomId()).toBeNull();
    expect(service.getStartAgainNumber()).toBeNull();
  });

  it('relit le numero de reprise comme un nombre', () => {
    service.saveStartAgainNumber(3);

    expect(service.getStartAgainNumber()).toBe(3);
  });

  it('rend null sur un numero de reprise qui n en est pas un', () => {
    localStorage.setItem('startAgainNumber:u1', 'trois');

    expect(service.getStartAgainNumber()).toBeNull();
  });

  it('compte le temps ecoule depuis le depart de la manche', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    service.startTimer('r1', 0);

    vi.advanceTimersByTime(4200);

    expect(service.getElapsedMs('r1', 0)).toBe(4200);
  });

  it('ne redemarre pas le chrono d une manche deja en cours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    service.startTimer('r1', 0);

    vi.advanceTimersByTime(1000);
    service.startTimer('r1', 0);
    vi.advanceTimersByTime(1000);

    expect(service.getElapsedMs('r1', 0)).toBe(2000);
  });

  it('repart de zero quand la manche change', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    service.startTimer('r1', 0);
    vi.advanceTimersByTime(1000);

    service.startTimer('r1', 1);
    vi.advanceTimersByTime(500);

    expect(service.getElapsedMs('r1', 1)).toBe(500);
  });

  it('ne rend aucun temps pour une manche qui n est pas celle du chrono', () => {
    service.startTimer('r1', 0);

    expect(service.getElapsedMs('r2', 0)).toBeNull();
    expect(service.getElapsedMs('r1', 1)).toBeNull();
  });

  it('ne rend aucun temps quand aucun chrono n a demarre', () => {
    expect(service.getElapsedMs('r1', 0)).toBeNull();
  });

  it('ne rend aucun temps sur un chrono illisible', () => {
    localStorage.setItem('roundTimer:u1', 'pas du json');

    expect(service.getElapsedMs('r1', 0)).toBeNull();
  });

  it('ne rend jamais un temps negatif si l horloge recule', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    service.startTimer('r1', 0);

    vi.setSystemTime(new Date(2026, 0, 1, 11, 59, 0));

    expect(service.getElapsedMs('r1', 0)).toBe(0);
  });

  it('retient le refus d installation pour l appareil, pas pour le compte', () => {
    expect(service.getPwaInstallDismissed()).toBe(false);

    service.setPwaInstallDismissed();
    currentUser = { uid: 'u2' };

    expect(service.getPwaInstallDismissed()).toBe(true);
  });

  it('ouvre une partie sur une ardoise vierge', () => {
    service.saveTries([{ word: 'CHAT' } as never]);
    service.saveStartAgainNumber(7);

    service.newGame('r9');

    expect(service.getRoomId()).toBe('r9');
    expect(service.getTries()).toEqual([]);
    expect(service.getStartAgainNumber()).toBe(0);
  });

  it('ouvre une reprise en gardant son numero', () => {
    service.newGame('r9', 2);

    expect(service.getStartAgainNumber()).toBe(2);
  });

  it('efface la partie sans toucher au refus d installation', () => {
    service.newGame('r1', 1);
    service.startTimer('r1', 1);
    service.setPwaInstallDismissed();

    service.clearLocalStorage();

    expect(service.getRoomId()).toBeNull();
    expect(service.getTries()).toBeNull();
    expect(service.getStartAgainNumber()).toBeNull();
    expect(service.getElapsedMs('r1', 1)).toBeNull();
    expect(service.getPwaInstallDismissed()).toBe(true);
  });
});
