import { EnvironmentProviders, PLATFORM_ID, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  overrideProvider as override,
} from '../../testing/test-providers';
import { UserService } from '../core/services/user.service';
import { WelcomeComponent } from './welcome.component';

const credential = (isAnonymous = false) => ({
  user: { email: 'joueur@example.com', isAnonymous },
});

/**
 * `IntersectionObserver` de jsdom n'observe rien : celui-ci retient son
 * rappel, pour que le test decide lui-meme qu'un bloc entre dans le champ.
 */
class CapturingObserver {
  static last: CapturingObserver | undefined;
  readonly observed: Element[] = [];
  readonly unobserved: Element[] = [];

  constructor(readonly callback: IntersectionObserverCallback) {
    CapturingObserver.last = this;
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  unobserve(element: Element): void {
    this.unobserved.push(element);
  }

  disconnect(): void {
    /* rien a defaire */
  }
}

describe('WelcomeComponent', () => {
  const nativeObserver = globalThis.IntersectionObserver;

  async function buildFixture(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<ComponentFixture<WelcomeComponent>> {
    await TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<WelcomeComponent> {
    return (await buildFixture(extra)).componentInstance;
  }

  beforeEach(() => {
    CapturingObserver.last = undefined;
    globalThis.IntersectionObserver =
      CapturingObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = nativeObserver;
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('prepare la fenetre de connexion des l ouverture', async () => {
    const warmUp = vi.fn();
    await build([override(UserService, { warmUpSignInPopup: warmUp })]);

    expect(warmUp).toHaveBeenCalled();
  });

  describe('apparition au defilement', () => {
    it('observe chaque bloc a reveler', async () => {
      const component = await build();

      expect(CapturingObserver.last?.observed.length).toBe(
        component.revealed().length,
      );
    });

    it('revele un bloc entre dans le champ, et cesse de l observer', async () => {
      await build();
      const observer = CapturingObserver.last!;
      const visible = observer.observed[0] as HTMLElement;
      const offscreen = observer.observed[1] as HTMLElement;

      observer.callback(
        [
          { isIntersecting: true, target: visible },
          { isIntersecting: false, target: offscreen },
        ] as unknown as IntersectionObserverEntry[],
        observer as unknown as IntersectionObserver,
      );

      expect(visible.classList.contains('visible')).toBe(true);
      expect(visible.style.getPropertyValue('--reveal-delay')).toBe('0s');
      expect(observer.unobserved).toEqual([visible]);
      expect(offscreen.classList.contains('visible')).toBe(false);
    });

    it('n observe rien au prerendu', async () => {
      const warmUp = vi.fn();
      await build([
        { provide: PLATFORM_ID, useValue: 'server' },
        override(UserService, { warmUpSignInPopup: warmUp }),
      ]);

      expect(CapturingObserver.last).toBeUndefined();
      expect(warmUp).not.toHaveBeenCalled();
    });
  });

  describe('connexion', () => {
    it('entre avec Google et souhaite la bienvenue', async () => {
      const component = await build([
        override(UserService, { signInWithGoogle: () => of(credential()) }),
      ]);
      const navigate = vi
        .spyOn(component.router, 'navigateByUrl')
        .mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.continueWithGoogle();

      expect(component.userService.currentUserSig()).toEqual({
        email: 'test@example.com',
        isAnonymous: false,
      });
      expect(navigate).toHaveBeenCalledWith('/accueil');
      expect(info).toHaveBeenCalledWith('Bienvenue sur Game Time', 'Game Time');
      expect(component.loading()).toBe(false);
    });

    it('entre avec GitHub', async () => {
      const component = await build([
        override(UserService, { signInWithGithub: () => of(credential()) }),
      ]);
      vi.spyOn(component.router, 'navigateByUrl').mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.continueWithGithub();

      expect(info).toHaveBeenCalledWith('Bienvenue sur Game Time', 'Game Time');
    });

    it('nomme « Compte invité » une fiche sans adresse', async () => {
      const component = await build([
        override(UserService, { signInWithGoogle: () => of(credential()) }),
      ]);
      vi.spyOn(component.router, 'navigateByUrl').mockResolvedValue(true);
      vi.spyOn(component.playerService, 'addPlayer').mockReturnValue(
        of(undefined as unknown as string),
      );

      component.continueWithGoogle();

      expect(component.userService.currentUserSig()).toEqual({
        email: 'Compte invité',
        isAnonymous: false,
      });
    });

    it('revient sur le lien demande avant la connexion', async () => {
      const component = await build([
        override(UserService, {
          signInWithGoogle: () => of(credential()),
          redirectUrl: '/room/r1',
        }),
      ]);
      const navigate = vi
        .spyOn(component.router, 'navigateByUrl')
        .mockResolvedValue(true);

      component.continueWithGoogle();

      expect(navigate).toHaveBeenCalledWith('/room/r1');
      // Consomme : une connexion suivante repart sur l'accueil.
      expect(component.userService.redirectUrl).toBeNull();
    });

    it('signale un echec de connexion', async () => {
      const component = await build([
        override(UserService, {
          signInWithGoogle: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.continueWithGoogle();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  describe('mode invite', () => {
    it('entre en invite', async () => {
      const component = await build([
        override(UserService, { signInAsGuest: () => of(credential(true)) }),
      ]);
      const navigate = vi
        .spyOn(component.router, 'navigateByUrl')
        .mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.continueAsGuest();

      expect(component.userService.currentUserSig()).toEqual({
        email: 'Compte invité',
        isAnonymous: true,
      });
      expect(navigate).toHaveBeenCalledWith('/accueil');
      expect(info).toHaveBeenCalledWith(
        'Connecté en invité. Tu pourras lier ton compte plus tard.',
        'Mode invité',
      );
    });

    it('signale un echec de connexion invite', async () => {
      const component = await build([
        override(UserService, {
          signInAsGuest: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.continueAsGuest();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  it('affiche un chargement pendant la connexion', async () => {
    const fixture = await buildFixture();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('mat-spinner'),
    ).toBeTruthy();
  });
});
