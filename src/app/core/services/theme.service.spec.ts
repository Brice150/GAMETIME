import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let listeners: ((event: { matches: boolean }) => void)[];

  /** Pose la preference systeme, et retient l'ecouteur pour pouvoir la faire changer. */
  function withSystemDark(matches: boolean): void {
    listeners = [];
    globalThis.matchMedia = ((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (
        _: string,
        listener: (e: { matches: boolean }) => void,
      ) => listeners.push(listener),
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof globalThis.matchMedia;
  }

  function service(platform = 'browser'): ThemeService {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    withSystemDark(true);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('suit le systeme quand rien n a ete choisi', () => {
    withSystemDark(false);

    expect(service().theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('prefere le choix memorise a la preference systeme', () => {
    localStorage.setItem('theme', 'light');
    withSystemDark(true);

    expect(service().theme()).toBe('light');
  });

  it('ignore une valeur memorisee qui ne designe aucun theme', () => {
    localStorage.setItem('theme', 'fuchsia');

    expect(service().theme()).toBe('dark');
  });

  it('bascule le theme et le memorise', () => {
    const themeService = service();

    themeService.toggle();

    expect(themeService.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    themeService.toggle();

    expect(themeService.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('reste sur le theme de la session quand le stockage refuse d ecrire', () => {
    const themeService = service();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('navigation privee');
    });

    themeService.toggle();

    expect(themeService.theme()).toBe('light');
  });

  it('ignore un stockage illisible et retombe sur le systeme', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('navigation privee');
    });
    withSystemDark(false);

    expect(service().theme()).toBe('light');
  });

  it('suit le systeme qui change tant qu aucun choix n est memorise', () => {
    const themeService = service();

    listeners.forEach((listener) => listener({ matches: false }));

    expect(themeService.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('cesse de suivre le systeme des qu un choix est memorise', () => {
    const themeService = service();
    themeService.toggle();

    listeners.forEach((listener) => listener({ matches: true }));

    expect(themeService.theme()).toBe('light');
  });

  it('reste en sombre au prerendu, ou il n y a pas de navigateur a interroger', () => {
    const themeService = service('server');

    themeService.toggle();

    expect(themeService.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBeNull();
  });
});
