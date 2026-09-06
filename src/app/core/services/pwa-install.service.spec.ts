import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { PwaInstallService } from './pwa-install.service';
import { ToastrHelperService } from './toastr-helper.service';

describe('PwaInstallService', () => {
  let dismissed: boolean;
  let setPwaInstallDismissed: Mock;
  let installPrompt: Mock<() => Observable<'install' | 'never'>>;
  let prompt: Mock;
  // Le service ecoute la fenetre et ne se detache jamais : sans ce suivi, le service d'un test
  // repondrait encore a l'evenement du suivant.
  let registered: [string, EventListener][];

  /**
   * Rejoue l'invitation du navigateur. On la fabrique ici plutot que de la simuler dans le
   * service : c'est l'evenement lui-meme qui porte `prompt`, et le test verifie qu'il est appele.
   */
  function browserOffersInstall(): Event {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
    return event;
  }

  function service(platform = 'browser'): PwaInstallService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: ToastrHelperService, useValue: { installPrompt } },
        {
          provide: LocalStorageService,
          useValue: {
            getPwaInstallDismissed: () => dismissed,
            setPwaInstallDismissed,
          },
        },
      ],
    });
    return TestBed.inject(PwaInstallService);
  }

  beforeEach(() => {
    dismissed = false;
    prompt = vi.fn(() => Promise.resolve());
    setPwaInstallDismissed = vi.fn();
    installPrompt = vi.fn(() => of('install' as const));
    registered = [];

    const add = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation(((
      type: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions,
    ) => {
      registered.push([type, listener]);
      add(type, listener, options);
    }) as typeof window.addEventListener);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [type, listener] of registered) {
      window.removeEventListener(type, listener);
    }
  });

  it('propose l installation des que le navigateur l offre', () => {
    service().init();

    browserOffersInstall();

    expect(installPrompt).toHaveBeenCalled();
    expect(prompt).toHaveBeenCalled();
    expect(setPwaInstallDismissed).not.toHaveBeenCalled();
  });

  it('retient le refus definitif du joueur', () => {
    installPrompt.mockReturnValue(of('never' as const));
    service().init();

    browserOffersInstall();

    expect(setPwaInstallDismissed).toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('ne propose plus rien apres un refus definitif', () => {
    dismissed = true;
    service().init();

    browserOffersInstall();

    expect(installPrompt).not.toHaveBeenCalled();
  });

  it('empeche le navigateur d afficher sa propre banniere', () => {
    service().init();

    const event = browserOffersInstall();

    expect(event.defaultPrevented).toBe(true);
  });

  it('oublie l invitation une fois l application installee', () => {
    service().init();
    browserOffersInstall();

    window.dispatchEvent(new Event('appinstalled'));

    // L'invitation gardee est la seule chose qui permettait de relancer l'installation.
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('ne s installe sur rien au prerendu', () => {
    service('server').init();

    expect(registered).toEqual([]);
  });
});
