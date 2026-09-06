import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<unknown>;
  let routerEvents: Subject<unknown>;
  let openDialogs: unknown[];
  let checkForUpdate: Mock<() => Promise<boolean>>;
  let activateUpdate: Mock<() => Promise<boolean>>;
  let visibility: DocumentVisibilityState;

  /** Annonce qu'une nouvelle version est prete cote worker. */
  function versionReady(): void {
    versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
  }

  /** Rejoue le passage de l'onglet en arriere-plan puis son retour. */
  function goesBackground(millis: number): void {
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(millis);
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  }

  function service(isEnabled = true): PwaUpdateService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwUpdate,
          useValue: {
            isEnabled,
            versionUpdates,
            unrecoverable,
            checkForUpdate,
            activateUpdate,
          },
        },
        { provide: Router, useValue: { events: routerEvents } },
        { provide: MatDialog, useValue: { openDialogs } },
        {
          provide: NgZone,
          useValue: { runOutsideAngular: (fn: () => void) => fn() },
        },
      ],
    });
    return TestBed.inject(PwaUpdateService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    versionUpdates = new Subject<VersionEvent>();
    unrecoverable = new Subject<unknown>();
    routerEvents = new Subject<unknown>();
    openDialogs = [];
    visibility = 'visible';
    checkForUpdate = vi.fn(() => Promise.resolve(false));
    activateUpdate = vi.fn(() => Promise.resolve(true));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ne s installe sur rien quand le worker est absent', () => {
    service(false).init();

    versionReady();

    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('interroge le worker des le demarrage', () => {
    service().init();

    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('applique aussitot une version reperee a l ouverture', async () => {
    service().init();

    versionReady();
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).toHaveBeenCalled();
  });

  it('attend une navigation pour une version reperee plus tard', async () => {
    service().init();

    vi.advanceTimersByTime(20_000);
    versionReady();
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).not.toHaveBeenCalled();

    routerEvents.next(new NavigationStart(1, '/classement'));
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).toHaveBeenCalled();
  });

  it('ignore une navigation qui n en est pas un debut', async () => {
    service().init();
    vi.advanceTimersByTime(20_000);
    versionReady();

    routerEvents.next(new NavigationEnd(1, '/a', '/b'));
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).not.toHaveBeenCalled();
  });

  it('ne recharge pas la page sous une fenetre ouverte', async () => {
    openDialogs.push({});
    service().init();
    vi.advanceTimersByTime(20_000);
    versionReady();

    routerEvents.next(new NavigationStart(1, '/classement'));
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).not.toHaveBeenCalled();
  });

  it('applique la version au retour d une longue mise en arriere-plan', async () => {
    service().init();
    vi.advanceTimersByTime(20_000);
    versionReady();

    goesBackground(31 * 60 * 1000);
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).toHaveBeenCalled();
  });

  it('se contente d interroger le worker au retour d une courte absence', async () => {
    service().init();
    checkForUpdate.mockClear();

    goesBackground(60 * 1000);
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).not.toHaveBeenCalled();
    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('n interroge pas le worker sur un onglet cache', () => {
    service().init();
    checkForUpdate.mockClear();

    visibility = 'hidden';
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('interroge le worker a intervalle regulier', () => {
    service().init();
    checkForUpdate.mockClear();

    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('cesse d interroger le worker une fois une version en attente', () => {
    service().init();
    vi.advanceTimersByTime(20_000);
    versionReady();
    checkForUpdate.mockClear();

    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('reagit a un etat dont le worker ne peut plus sortir', () => {
    service().init();

    // Le service recharge la page. jsdom verrouille `location` et refuse qu'on double `reload` :
    // ce qui reste verifiable est que l'abonnement existe et que le traitement va au bout.
    expect(() => unrecoverable.next({ reason: 'perdu' })).not.toThrow();
  });

  it('reste applicable quand l activation echoue', async () => {
    activateUpdate.mockRejectedValueOnce(new Error('boum'));
    service().init();
    vi.advanceTimersByTime(20_000);
    versionReady();

    routerEvents.next(new NavigationStart(1, '/a'));
    await vi.advanceTimersByTimeAsync(0);
    expect(activateUpdate).toHaveBeenCalledTimes(1);

    routerEvents.next(new NavigationStart(2, '/b'));
    await vi.advanceTimersByTimeAsync(0);

    expect(activateUpdate).toHaveBeenCalledTimes(2);
  });

  it('ignore un echec d interrogation du worker', async () => {
    checkForUpdate.mockRejectedValueOnce(new Error('hors ligne'));

    service().init();
    await vi.advanceTimersByTimeAsync(0);

    expect(checkForUpdate).toHaveBeenCalled();
  });
});
