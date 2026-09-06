import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionService } from './connection.service';
import { SmartPreloading } from './smart-preloading.service';

describe('SmartPreloading', () => {
  const route: Route = { path: 'accueil' };
  let strategy: SmartPreloading;
  let shouldPreload: Mock<() => boolean>;
  let load: Mock<() => Observable<unknown>>;

  /** S'abonne a la strategie et note ce qu'elle a emis. */
  function preload(target: Route): unknown[] {
    const emitted: unknown[] = [];
    strategy.preload(target, load).subscribe((value) => emitted.push(value));
    return emitted;
  }

  beforeEach(() => {
    // Le delai de la strategie est un timer rxjs, qui lit l'horloge de la page. Piloter cette
    // horloge le deroule aussi precisement qu'une attente reelle, sans en payer le temps.
    vi.useFakeTimers();
    shouldPreload = vi.fn(() => true);
    load = vi.fn(() => of('chunk') as Observable<unknown>);
    TestBed.configureTestingModule({
      providers: [{ provide: ConnectionService, useValue: { shouldPreload } }],
    });
    strategy = TestBed.inject(SmartPreloading);
  });

  afterEach(() => vi.useRealTimers());

  it('laisse tranquille une route exclue du prechargement', () => {
    const emitted = preload({ ...route, data: { preload: false } });

    vi.advanceTimersByTime(5000);

    expect(load).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('attend avant de tirer un chunk, pour servir le premier ecran d abord', () => {
    const emitted = preload(route);

    vi.advanceTimersByTime(1499);
    expect(load).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalled();
    expect(emitted).toEqual(['chunk']);
  });

  it('renonce quand la connexion ne suit pas une fois le delai passe', () => {
    shouldPreload.mockReturnValue(false);

    const emitted = preload(route);
    vi.advanceTimersByTime(2000);

    expect(load).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('lit la connexion a la fin du delai, pas a la rencontre de la route', () => {
    shouldPreload.mockReturnValue(false);
    const emitted = preload(route);

    // Le visiteur retrouve un meilleur reseau pendant le delai.
    shouldPreload.mockReturnValue(true);
    vi.advanceTimersByTime(2000);

    expect(load).toHaveBeenCalled();
    expect(emitted).toEqual(['chunk']);
  });
});
