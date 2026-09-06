import { EnvironmentProviders, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../testing/test-providers';
import { Player } from '../core/interfaces/player';
import { LocalStorageService } from '../core/services/local-storage.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  async function buildFixture(
    player: Player = buildPlayer(),
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<ComponentFixture<HeaderComponent>> {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('player', player);
    fixture.detectChanges();
    return fixture;
  }

  async function build(
    player?: Player,
    extra?: (Provider | EnvironmentProviders)[],
  ): Promise<HeaderComponent> {
    return (await buildFixture(player, extra)).componentInstance;
  }

  /** Le titre est calcule sur l'URL, lue a l'ouverture de l'entete. */
  function atUrl(url: string): void {
    vi.spyOn(Router.prototype, 'url', 'get').mockReturnValue(url);
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('titre de page', () => {
    it('nomme les pages connues', async () => {
      atUrl('/parametres');
      expect((await build()).pageTitle()).toBe('Paramètres');
    });

    it('nomme la section admin', async () => {
      atUrl('/admin/joueurs');
      expect((await build()).pageTitle()).toBe('Admin');
    });

    it('garde le nom de l application a la racine', async () => {
      atUrl('/');
      expect((await build()).pageTitle()).toBe('Game Time');
    });

    it('annonce le jeu de la room ouverte', async () => {
      atUrl('/room/r1');
      const component = await build();
      component.roomService.currentRoomSig.set(
        buildRoom({ gameName: 'drapeaux' }),
      );

      expect(component.isRoomPage()).toBe(true);
      expect(component.pageTitle()).toBe('Drapeaux');
    });

    it('retombe sur le code quand le jeu n est pas encore choisi', async () => {
      atUrl('/room/r1');
      const component = await build();
      component.roomService.currentRoomSig.set(buildRoom({ gameName: '' }));

      expect(component.pageTitle()).toBe('ABCD');
    });

    it('reste generique sur une room pas encore chargee', async () => {
      atUrl('/room/r1');
      const component = await build();

      expect(component.isRoomPage()).toBe(false);
      expect(component.pageTitle()).toBe('Game Time');
    });

    it('reprend l URL pour une page sans titre declare', async () => {
      atUrl('/succes');
      expect((await build()).pageTitle()).toBe('succes');
    });
  });

  describe('navigation', () => {
    it('propose accueil, classement et parametres', async () => {
      const component = await build();

      expect(component.navLinks().map((link) => link.path)).toEqual([
        '/accueil',
        '/classement',
        '/parametres',
      ]);
    });

    it('ajoute la room memorisee et la section admin', async () => {
      const component = await build(buildPlayer({ isAdmin: true }), [
        override(LocalStorageService, { getRoomId: () => 'r1' }),
      ]);

      expect(component.navLinks().map((link) => link.path)).toEqual([
        '/accueil',
        '/classement',
        '/room/r1',
        '/admin',
        '/parametres',
      ]);
    });

    it('signale les demandes d amis en attente', async () => {
      const component = await build(
        buildPlayer({ friendRequestIds: ['u2', 'u3'] }),
      );

      expect(component.pendingRequestsNumber()).toBe(2);
      expect(component.navLinks().at(-1)?.badge).toBe(2);
    });

    it('relit URL et room memorisee a chaque navigation', async () => {
      let roomId: string | null = null;
      const component = await build(buildPlayer(), [
        provideRouter([{ path: 'accueil', children: [] }]),
        override(LocalStorageService, { getRoomId: () => roomId }),
      ]);

      expect(component.navLinks().map((link) => link.path)).not.toContain(
        '/room/r1',
      );

      // Ni l'URL ni le stockage local ne sont reactifs : seule la navigation
      // les fait relire.
      roomId = 'r1';
      await TestBed.inject(Router).navigateByUrl('/accueil');

      expect(component.pageTitle()).toBe('Accueil');
      expect(component.navLinks().map((link) => link.path)).toContain(
        '/room/r1',
      );
    });
  });

  it('remonte la demande de deconnexion', async () => {
    const component = await build();
    const emitted = vi.fn();
    component.logoutEvent.subscribe(emitted);

    component.logout();

    expect(emitted).toHaveBeenCalled();
  });
});
