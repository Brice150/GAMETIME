import { TestBed } from '@angular/core/testing';
import { Auth, UserCredential } from '@angular/fire/auth';
import { firstValueFrom, of } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApiService } from './game-api.service';
import { UserService } from './user.service';

// Le SDK d'authentification est remplace au niveau du module : le service appelle ses fonctions
// directement, et aucune fenetre ne peut s'ouvrir sous jsdom.
const signInWithPopup = vi.fn((_auth: unknown, provider: { id: string }) =>
  Promise.resolve({ user: { email: 'repris@example.com' }, provider }),
);
const linkWithPopup = vi.fn((_user: unknown, provider: { id: string }) =>
  Promise.resolve({ user: { email: 'lie@example.com' }, provider }),
);
const signInAnonymously = vi.fn(() =>
  Promise.resolve({ user: { email: null } }),
);
const signOut = vi.fn(() => Promise.resolve());

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  GoogleAuthProvider: class {
    id = 'google';
  },
  GithubAuthProvider: class {
    id = 'github';
  },
  user: () => of(null),
  signInWithPopup: (auth: unknown, provider: { id: string }) =>
    signInWithPopup(auth, provider),
  linkWithPopup: (currentUser: unknown, provider: { id: string }) =>
    linkWithPopup(currentUser, provider),
  signInAnonymously: () => signInAnonymously(),
  signOut: () => signOut(),
}));

describe('UserService', () => {
  let service: UserService;
  let auth: Record<string, unknown>;
  let currentUser: Record<string, unknown> | null;
  let linkGuestAccount: Mock;

  /** Le fournisseur passe a la derniere ouverture de fenetre. */
  function providerOf(call: Mock): string {
    return (call.mock.lastCall![1] as { id: string }).id;
  }

  function build(): UserService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: GameApiService, useValue: { linkGuestAccount } },
      ],
    });
    return TestBed.inject(UserService);
  }

  beforeEach(() => {
    signInWithPopup.mockClear();
    linkWithPopup.mockClear();
    signInAnonymously.mockClear();
    signOut.mockClear();
    linkGuestAccount = vi.fn(() => of({ migrated: true }));
    currentUser = {
      isAnonymous: true,
      getIdToken: () => Promise.resolve('jeton-invite'),
    };
    auth = {
      get currentUser() {
        return currentUser;
      },
    };
    service = build();
  });

  it('ouvre la connexion Google', async () => {
    await firstValueFrom(service.signInWithGoogle());

    expect(providerOf(signInWithPopup)).toBe('google');
  });

  it('ouvre la connexion GitHub', async () => {
    await firstValueFrom(service.signInWithGithub());

    expect(providerOf(signInWithPopup)).toBe('github');
  });

  it('ouvre une session invite', async () => {
    await firstValueFrom(service.signInAsGuest());

    expect(signInAnonymously).toHaveBeenCalled();
  });

  it('deconnecte et oublie le compte aussitot', async () => {
    service.currentUserSig.set({ email: 'a@b.c', isAnonymous: false });

    await firstValueFrom(service.logout());

    expect(signOut).toHaveBeenCalled();
    expect(service.currentUserSig()).toBeNull();
  });

  describe('prechauffage de la fenetre de connexion', () => {
    it('initialise le resolveur une seule fois', () => {
      const initialize = vi.fn(() => Promise.resolve());
      auth['_popupRedirectResolver'] = { _initialize: initialize };

      service.warmUpSignInPopup();
      service.warmUpSignInPopup();

      expect(initialize).toHaveBeenCalledTimes(1);
    });

    it('reessaiera plus tard si le prechauffage echoue', async () => {
      const initialize = vi.fn(() => Promise.reject(new Error('boum')));
      auth['_popupRedirectResolver'] = { _initialize: initialize };

      service.warmUpSignInPopup();
      await Promise.resolve();
      await Promise.resolve();
      service.warmUpSignInPopup();

      expect(initialize).toHaveBeenCalledTimes(2);
    });

    it('ne fait rien quand le SDK n expose aucun resolveur', () => {
      expect(() => service.warmUpSignInPopup()).not.toThrow();
    });
  });

  describe('rattachement d un compte invite', () => {
    it('rattache le compte et retient l adresse obtenue', async () => {
      const credential = await firstValueFrom(
        service.linkAnonymousAccountWithGoogle(),
      );

      expect(providerOf(linkWithPopup)).toBe('google');
      expect((credential as UserCredential).user.email).toBe('lie@example.com');
      expect(service.currentUserSig()).toEqual({
        email: 'lie@example.com',
        isAnonymous: false,
      });
      expect(linkGuestAccount).not.toHaveBeenCalled();
    });

    it('rattache aussi via GitHub', async () => {
      await firstValueFrom(service.linkAnonymousAccountWithGithub());

      expect(providerOf(linkWithPopup)).toBe('github');
    });

    it('refuse quand personne n est connecte', async () => {
      currentUser = null;

      const failure = await new Promise<Error>((resolve) =>
        service.linkAnonymousAccountWithGoogle().subscribe({ error: resolve }),
      );

      expect(failure.message).toBe('Aucun utilisateur connecté.');
    });

    it('refuse quand le compte courant n est pas temporaire', async () => {
      currentUser = { isAnonymous: false };

      const failure = await new Promise<Error>((resolve) =>
        service.linkAnonymousAccountWithGoogle().subscribe({ error: resolve }),
      );

      expect(failure.message).toBe(
        'Le compte courant n est pas un compte temporaire.',
      );
    });

    it('bascule sur le compte existant et fait migrer la progression', async () => {
      linkWithPopup.mockRejectedValueOnce({
        code: 'auth/credential-already-in-use',
      });

      const credential = await firstValueFrom(
        service.linkAnonymousAccountWithGoogle(),
      );

      expect(linkGuestAccount).toHaveBeenCalledWith('jeton-invite');
      expect((credential as UserCredential).user.email).toBe(
        'repris@example.com',
      );
      expect(service.currentUserSig()).toEqual({
        email: 'repris@example.com',
        isAnonymous: false,
      });
    });

    it('bascule aussi sur une autre methode de connexion deja utilisee', async () => {
      linkWithPopup.mockRejectedValueOnce({
        code: 'auth/account-exists-with-different-credential',
      });

      await firstValueFrom(service.linkAnonymousAccountWithGoogle());

      expect(linkGuestAccount).toHaveBeenCalled();
    });

    it('bascule aussi quand l adresse est deja prise', async () => {
      linkWithPopup.mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
      });

      await firstValueFrom(service.linkAnonymousAccountWithGoogle());

      expect(linkGuestAccount).toHaveBeenCalled();
    });

    it('laisse remonter une erreur qui ne vient pas d un compte existant', async () => {
      linkWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked' });

      const failure = await new Promise<{ code: string }>((resolve) =>
        service.linkAnonymousAccountWithGoogle().subscribe({ error: resolve }),
      );

      expect(failure.code).toBe('auth/popup-blocked');
      expect(linkGuestAccount).not.toHaveBeenCalled();
    });

    it('retient Compte invite quand le compte repris n a pas d adresse', async () => {
      linkWithPopup.mockResolvedValueOnce({
        user: { email: null },
      } as never);

      await firstValueFrom(service.linkAnonymousAccountWithGoogle());

      expect(service.currentUserSig()).toEqual({
        email: 'Compte invité',
        isAnonymous: false,
      });
    });
  });
});
