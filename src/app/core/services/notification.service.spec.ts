import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';

// Firestore et le SDK de messagerie sont appeles comme des fonctions libres : on les remplace au
// niveau du module pour observer les jetons enregistres, sans projet Firebase ni service worker.
const setDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const deleteDoc = vi.fn((path: string) => Promise.resolve(path));
const getToken = vi.fn(() => Promise.resolve('jeton-fcm'));
const deleteToken = vi.fn(() => Promise.resolve(true));
const isSupported = vi.fn(() => Promise.resolve(true));
const getMessaging = vi.fn(() => ({ name: 'messaging' }));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  doc: (_firestore: unknown, path: string) => path,
  setDoc: (path: string, data: Record<string, unknown>) => setDoc(path, data),
  deleteDoc: (path: string) => deleteDoc(path),
}));
vi.mock('@angular/fire/app', () => ({ getApp: () => ({ name: 'app' }) }));
vi.mock('firebase/messaging', () => ({
  getMessaging: () => getMessaging(),
  getToken: () => getToken(),
  deleteToken: () => deleteToken(),
  isSupported: () => isSupported(),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let permission: NotificationPermission;
  let requestPermission: Mock<() => Promise<NotificationPermission>>;
  let constructed: [string, NotificationOptions][];
  let hidden: boolean;
  let vapidKey: string | undefined;

  function build(): NotificationService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
        {
          provide: UserService,
          useValue: { auth: { currentUser: { uid: 'u1' } } },
        },
      ],
    });
    return TestBed.inject(NotificationService);
  }

  /** Remplace l'API Notification du navigateur, absente de jsdom. */
  function withNotificationApi(): void {
    const fake = function (
      this: unknown,
      title: string,
      options: NotificationOptions,
    ) {
      constructed.push([title, options]);
    } as unknown as typeof Notification;
    Object.defineProperty(fake, 'permission', { get: () => permission });
    Object.defineProperty(fake, 'requestPermission', {
      value: () => requestPermission(),
    });
    globalThis.Notification = fake;
  }

  beforeEach(() => {
    setDoc.mockClear();
    deleteDoc.mockClear();
    getToken.mockClear();
    deleteToken.mockClear();
    isSupported.mockClear();
    isSupported.mockResolvedValue(true);
    getToken.mockResolvedValue('jeton-fcm');

    localStorage.clear();
    constructed = [];
    permission = 'granted';
    hidden = true;
    requestPermission = vi.fn(() => Promise.resolve('granted' as const));
    vapidKey = environment.vapidKey;
    (environment as { vapidKey?: string }).vapidKey = 'cle-vapid';

    withNotificationApi();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    service = build();
  });

  afterEach(() => {
    (environment as { vapidKey?: string }).vapidKey = vapidKey;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('etat', () => {
    it('se dit indisponible quand le navigateur ignore les notifications', () => {
      (globalThis as { Notification?: unknown }).Notification = undefined;

      expect(service.permission).toBe('unsupported');
      expect(service.isSupported).toBe(false);
      expect(service.isEnabled).toBe(false);
    });

    it('se dit bloque quand le visiteur a refuse', () => {
      permission = 'denied';

      expect(service.isBlocked).toBe(true);
      expect(service.isEnabled).toBe(false);
    });

    it('est actif quand la permission est acquise et rien n a ete coupe', () => {
      expect(service.isEnabled).toBe(true);
    });

    it('est inactif quand le visiteur a coupe les notifications', () => {
      localStorage.setItem('invitationNotifications', 'false');

      expect(service.isEnabled).toBe(false);
    });

    it('sait que le push exige une cle VAPID', () => {
      expect(service.isPushConfigured).toBe(true);

      (environment as { vapidKey?: string }).vapidKey = '';

      expect(service.isPushConfigured).toBe(false);
    });
  });

  describe('disponibilite du push', () => {
    it('depend a la fois de la cle et du navigateur', async () => {
      await expect(service.isPushAvailable()).resolves.toBe(true);

      isSupported.mockResolvedValueOnce(false);
      await expect(service.isPushAvailable()).resolves.toBe(false);
    });

    it('repond non quand le SDK echoue a se prononcer', async () => {
      isSupported.mockRejectedValueOnce(new Error('boum'));

      await expect(service.isPushAvailable()).resolves.toBe(false);
    });

    it('repond non sans cle VAPID, sans meme interroger le SDK', async () => {
      (environment as { vapidKey?: string }).vapidKey = '';

      await expect(service.isPushAvailable()).resolves.toBe(false);
      expect(isSupported).not.toHaveBeenCalled();
    });
  });

  describe('activation', () => {
    it('refuse d activer ce que le navigateur ne sait pas faire', async () => {
      (globalThis as { Notification?: unknown }).Notification = undefined;

      await expect(service.enable()).resolves.toBe(false);
    });

    it('enregistre un jeton sans redemander une permission acquise', async () => {
      await expect(service.enable()).resolves.toBe(true);

      expect(requestPermission).not.toHaveBeenCalled();
      expect(localStorage.getItem('invitationNotifications')).toBe('true');
      expect(setDoc.mock.lastCall![0]).toBe('fcmTokens/jeton-fcm');
      expect(setDoc.mock.lastCall![1]).toMatchObject({
        token: 'jeton-fcm',
        userId: 'u1',
      });
    });

    it('demande la permission quand elle n a pas encore ete donnee', async () => {
      permission = 'default';

      await expect(service.enable()).resolves.toBe(true);

      expect(requestPermission).toHaveBeenCalled();
    });

    it('renonce quand le visiteur refuse', async () => {
      permission = 'default';
      requestPermission.mockResolvedValueOnce('denied');

      await expect(service.enable()).resolves.toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('n enregistre aucun jeton vide', async () => {
      getToken.mockResolvedValueOnce('');

      await service.enable();

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('reste actif en local quand le push est indisponible', async () => {
      getToken.mockRejectedValueOnce(new Error('pas de worker'));

      await expect(service.enable()).resolves.toBe(true);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('n enregistre rien quand le push n est pas disponible', async () => {
      isSupported.mockResolvedValue(false);

      await expect(service.enable()).resolves.toBe(true);
      expect(getToken).not.toHaveBeenCalled();
    });
  });

  describe('desactivation', () => {
    it('coupe les notifications et retire le jeton', async () => {
      await service.disable();

      expect(localStorage.getItem('invitationNotifications')).toBe('false');
      expect(deleteDoc).toHaveBeenCalledWith('fcmTokens/jeton-fcm');
      expect(deleteToken).toHaveBeenCalled();
    });

    it('ne retire rien quand aucun jeton n existe', async () => {
      getToken.mockResolvedValueOnce('');

      await service.disable();

      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('laisse le serveur purger un jeton qu il ne peut pas relire', async () => {
      getToken.mockRejectedValueOnce(new Error('boum'));

      await expect(service.disable()).resolves.toBeUndefined();
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('coupe quand meme les notifications sans push disponible', async () => {
      isSupported.mockResolvedValue(false);

      await service.disable();

      expect(localStorage.getItem('invitationNotifications')).toBe('false');
      expect(deleteToken).not.toHaveBeenCalled();
    });
  });

  describe('au demarrage', () => {
    it('reenregistre le jeton, qui tourne avec le temps', async () => {
      await service.initOnStartup();

      expect(setDoc).toHaveBeenCalled();
    });

    it('ne reenregistre rien quand les notifications sont coupees', async () => {
      localStorage.setItem('invitationNotifications', 'false');

      await service.initOnStartup();

      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('notification locale', () => {
    it('ne double pas le toast quand l onglet est au premier plan', () => {
      hidden = false;

      service.notify('Invitation', 'Alice vous invite');

      expect(constructed).toEqual([]);
    });

    it('ne notifie rien quand les notifications sont coupees', () => {
      localStorage.setItem('invitationNotifications', 'false');

      service.notify('Invitation', 'Alice vous invite');

      expect(constructed).toEqual([]);
    });

    it('passe par le service worker quand il en existe un', async () => {
      const showNotification = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          getRegistration: () => Promise.resolve({ showNotification }),
        },
      });

      service.notify('Invitation', 'Alice vous invite', 'r1');
      await Promise.resolve();
      await Promise.resolve();

      expect(showNotification).toHaveBeenCalledWith('Invitation', {
        body: 'Alice vous invite',
        tag: 'r1',
      });
      expect(constructed).toEqual([]);
    });

    it('construit la notification lui-meme sans worker enregistre', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: () => Promise.resolve(undefined) },
      });

      service.notify('Invitation', 'Alice vous invite');
      await Promise.resolve();
      await Promise.resolve();

      expect(constructed[0][0]).toBe('Invitation');
    });

    it('construit la notification lui-meme quand le worker echoue', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: () => Promise.reject(new Error('boum')) },
      });

      service.notify('Invitation', 'Alice vous invite');
      await Promise.resolve();
      await Promise.resolve();

      expect(constructed[0][0]).toBe('Invitation');
    });

    it('se tait quand la plateforme refuse la notification', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: () => Promise.resolve(undefined) },
      });
      globalThis.Notification = function () {
        throw new Error('refuse');
      } as unknown as typeof Notification;

      service.notify('Invitation', 'Alice vous invite');
      await Promise.resolve();
      await Promise.resolve();

      expect(constructed).toEqual([]);
    });
  });

  describe('installation exigee sur iOS', () => {
    /** Pose l'appareil et le mode d'affichage annonces par le navigateur. */
    function withDevice(userAgent: string, standalone: boolean): void {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        value: userAgent,
      });
      globalThis.matchMedia = ((query: string) => ({
        matches: standalone,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        onchange: null,
        dispatchEvent: () => false,
      })) as unknown as typeof globalThis.matchMedia;
    }

    it('exige l installation sur un iPhone ouvert dans le navigateur', () => {
      withDevice('iPhone', false);

      expect(service.requiresInstall).toBe(true);
    });

    it('n exige rien une fois l application ajoutee a l ecran d accueil', () => {
      withDevice('iPhone', true);

      expect(service.requiresInstall).toBe(false);
    });

    it('n exige rien ailleurs que sur iOS', () => {
      withDevice('Android', false);

      expect(service.requiresInstall).toBe(false);
    });

    it('reconnait un iPad qui se presente comme un Mac tactile', () => {
      withDevice('Macintosh', false);
      Object.defineProperty(navigator, 'platform', {
        configurable: true,
        value: 'MacIntel',
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: 5,
      });

      expect(service.requiresInstall).toBe(true);
    });
  });
});
