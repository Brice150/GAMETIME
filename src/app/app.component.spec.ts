import { EnvironmentProviders, PLATFORM_ID, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  overrideProvider as override,
} from '../testing/test-providers';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import {
  AppComponent,
  SHELL_FADE_MS,
  SHELL_LOADER_TIMEOUT_MS,
} from './app.component';
import { NotificationService } from './core/services/notification.service';
import { PlayerService } from './core/services/player.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { UserService } from './core/services/user.service';

const signedIn = { email: 'joueur@example.com', isAnonymous: false };

describe('AppComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<AppComponent> {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /** Ecran de chargement pose par index.html, retire des la session connue. */
  function addShellLoader(): HTMLElement {
    const loader = document.createElement('div');
    loader.id = 'app-shell-loader';
    document.body.appendChild(loader);
    return loader;
  }

  /** Laisse le temps au fondu de l'ecran de chargement de se terminer. */
  function fadeOut(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, SHELL_FADE_MS));
  }

  afterEach(() => {
    document.getElementById('app-shell-loader')?.remove();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('amorce mise a jour et installation dans un navigateur', async () => {
    const update = vi.fn();
    const install = vi.fn();
    await build([
      override(PwaUpdateService, { init: update }),
      override(PwaInstallService, { init: install }),
    ]);

    expect(update).toHaveBeenCalled();
    expect(install).toHaveBeenCalled();
  });

  it('n amorce rien au prerendu', async () => {
    const update = vi.fn();
    const install = vi.fn();
    await build([
      { provide: PLATFORM_ID, useValue: 'server' },
      override(PwaUpdateService, { init: update }),
      override(PwaInstallService, { init: install }),
    ]);

    expect(update).not.toHaveBeenCalled();
    expect(install).not.toHaveBeenCalled();
  });

  describe('session', () => {
    it('retire l ecran de chargement et oublie le compte a la deconnexion', async () => {
      const loader = addShellLoader();
      const component = await build();

      expect(loader.classList).toContain('is-leaving');
      await fadeOut();
      expect(loader.isConnected).toBe(false);
      expect(component.userService.currentUserSig()).toBeNull();
      expect(component.playerService.currentPlayerSig()).toBeNull();
    });

    it('charge la fiche du joueur connecte et rafraichit son jeton push', async () => {
      const player = buildPlayer();
      const initOnStartup = vi.fn().mockResolvedValue(undefined);
      const component = await build([
        override(UserService, { user$: of(signedIn) }),
        override(PlayerService, { getPlayer: () => of([player]) }),
        override(NotificationService, { initOnStartup }),
      ]);

      expect(component.userService.currentUserSig()).toEqual({
        email: 'joueur@example.com',
        isAnonymous: false,
      });
      expect(component.playerService.currentPlayerSig()).toBe(player);
      expect(initOnStartup).toHaveBeenCalled();
    });

    it('nomme « Compte invité » une session sans adresse', async () => {
      const component = await build([
        override(UserService, {
          user$: of({ email: null, isAnonymous: true }),
        }),
        override(PlayerService, { getPlayer: () => of([]) }),
      ]);

      expect(component.userService.currentUserSig()).toEqual({
        email: 'Compte invité',
        isAnonymous: true,
      });
      expect(component.playerService.currentPlayerSig()).toBeNull();
    });

    it('signale un echec de session sans laisser l ecran de chargement', async () => {
      const loader = addShellLoader();
      const component = await build([
        override(UserService, {
          user$: throwError(() => new Error('refus')),
        }),
      ]);
      await fadeOut();

      expect(loader.isConnected).toBe(false);
      expect(component).toBeTruthy();
    });

    it('garde l ecran de chargement dans la page prerendue', async () => {
      const loader = addShellLoader();
      await build([{ provide: PLATFORM_ID, useValue: 'server' }]);

      expect(loader.isConnected).toBe(true);
      expect(loader.classList).not.toContain('is-leaving');
    });

    it('attend que le routeur ait fini, redirection comprise', async () => {
      const loader = addShellLoader();
      const events = new Subject<unknown>();
      let navigating = true;
      await TestBed.configureTestingModule({
        imports: [AppComponent],
        providers: appTestProviders(),
      }).compileComponents();
      const router = TestBed.inject(Router);
      Object.defineProperty(router, 'currentNavigation', {
        value: () => (navigating ? {} : null),
      });
      Object.defineProperty(router, 'events', { value: events });

      TestBed.createComponent(AppComponent).detectChanges();
      expect(loader.classList).not.toContain('is-leaving');

      navigating = false;
      events.next(new NavigationEnd(1, '/', '/accueil'));
      await new Promise((resolve) => setTimeout(resolve));

      expect(loader.classList).toContain('is-leaving');
    });

    it('finit par afficher l application si la session ne repond pas', async () => {
      vi.useFakeTimers();
      const loader = addShellLoader();
      await build([override(UserService, { user$: new Subject() })]);

      expect(loader.classList).not.toContain('is-leaving');

      vi.advanceTimersByTime(SHELL_LOADER_TIMEOUT_MS);
      expect(loader.classList).toContain('is-leaving');
      vi.useRealTimers();
    });
  });

  describe('deconnexion', () => {
    it('renvoie a l ecran d accueil', async () => {
      const component = await build();
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.logout();

      expect(navigate).toHaveBeenCalledWith(['/']);
      expect(info).toHaveBeenCalledWith(
        'Vous avez été déconnecté',
        'Déconnexion',
      );
    });

    it('signale un echec de deconnexion', async () => {
      const component = await build([
        override(UserService, {
          logout: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.logout();

      expect(handleError).toHaveBeenCalled();
    });
  });
});
