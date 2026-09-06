import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConnectionService } from './connection.service';

interface FakeConnection extends EventTarget {
  effectiveType: string;
  downlink: number;
  saveData: boolean;
}

describe('ConnectionService', () => {
  let listeners: (() => void)[];

  /**
   * Pose un reseau de la forme demandee sur le navigateur. Le renvoie pour qu'un test puisse le
   * faire changer et annoncer le changement comme le navigateur le fait.
   */
  function withNetwork(
    shape: Partial<
      Pick<FakeConnection, 'effectiveType' | 'downlink' | 'saveData'>
    >,
  ): FakeConnection {
    const connection = {
      effectiveType: '4g',
      downlink: 10,
      saveData: false,
      ...shape,
      addEventListener: (_: string, listener: () => void) =>
        listeners.push(listener),
      removeEventListener: () => undefined,
    } as unknown as FakeConnection;
    Object.defineProperty(navigator, 'connection', {
      value: connection,
      configurable: true,
    });
    return connection;
  }

  /**
   * Cache le reseau au service.
   *
   * L'absence doit etre posee, pas seulement laissee : un test precedent a pu deposer son propre
   * reseau, et le suivant heriterait alors d'une bande passante qu'il n'a pas demandee.
   */
  function withoutNetwork(): void {
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
    });
  }

  function service(platform = 'browser'): ConnectionService {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(ConnectionService);
  }

  beforeEach(() => {
    listeners = [];
    withoutNetwork();
  });

  it('precharge sur une connexion large', () => {
    withNetwork({ effectiveType: '4g', downlink: 10 });

    expect(service().shouldPreload()).toBe(true);
  });

  it('renonce quand le visiteur demande a economiser ses donnees', () => {
    withNetwork({ saveData: true });

    expect(service().shouldPreload()).toBe(false);
  });

  it('renonce sur un reseau lent', () => {
    withNetwork({ effectiveType: '3g' });

    expect(service().shouldPreload()).toBe(false);
  });

  it('renonce sous le seuil de bande passante', () => {
    withNetwork({ downlink: 1.4 });

    expect(service().shouldPreload()).toBe(false);
  });

  it('accepte le seuil lui-meme', () => {
    withNetwork({ downlink: 1.5 });

    expect(service().shouldPreload()).toBe(true);
  });

  it('suit le reseau quand il change sous le visiteur', () => {
    const connection = withNetwork({ effectiveType: '4g', downlink: 10 });
    const connectionService = service();
    expect(connectionService.shouldPreload()).toBe(true);

    connection.effectiveType = '2g';
    listeners.forEach((listener) => listener());

    expect(connectionService.shouldPreload()).toBe(false);
  });

  it('publie chaque changement sur le flux', () => {
    const connection = withNetwork({ effectiveType: '4g', downlink: 10 });
    const connectionService = service();
    const seen: boolean[] = [];
    connectionService.canPreload$.subscribe((value) => seen.push(value));

    connection.saveData = true;
    listeners.forEach((listener) => listener());

    expect(seen).toEqual([true, false]);
  });

  it('precharge quand le navigateur ne dit rien du reseau', () => {
    withoutNetwork();

    expect(service().shouldPreload()).toBe(true);
  });

  it('precharge sur le serveur, ou il n y a pas de navigateur a interroger', () => {
    withNetwork({ effectiveType: '2g', saveData: true });

    expect(service('server').shouldPreload()).toBe(true);
  });
});
