import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
  ConsentService,
} from './consent.service';

interface Ads {
  enabled: boolean;
  cmp: string;
}

describe('ConsentService', () => {
  const ads = environment.ads as Ads;
  let enabled: boolean;
  let cmp: string;

  function build(platform = 'browser'): ConsentService {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(ConsentService);
  }

  function store(choice: unknown): void {
    localStorage.setItem('consent', JSON.stringify(choice));
  }

  /** Commandes `gtag` recues, sous forme de tableaux. */
  function gtagCalls(): unknown[][] {
    const layer = (window as unknown as { dataLayer?: IArguments[] }).dataLayer;
    return (layer ?? []).map((entry) => Array.from(entry));
  }

  beforeEach(() => {
    enabled = ads.enabled;
    cmp = ads.cmp;
    localStorage.clear();
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
  });

  afterEach(() => {
    ads.enabled = enabled;
    ads.cmp = cmp;
    delete (window as unknown as { googlefc?: unknown }).googlefc;
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('publicite desactivee', () => {
    beforeEach(() => (ads.enabled = false));

    it('ne demande rien et n envoie aucun signal', () => {
      const service = build();

      expect(service.required).toBe(false);
      expect(service.bannerVisible()).toBe(false);
      expect(service.adsAllowed()).toBe(false);
      expect(gtagCalls()).toEqual([]);
    });

    it('n autorise pas la publicite meme apres acceptation', () => {
      const service = build();

      service.acceptAll();

      expect(service.adsAllowed()).toBe(false);
      expect(gtagCalls()).toEqual([]);
    });
  });

  describe('CMP de Google', () => {
    beforeEach(() => {
      ads.enabled = true;
      ads.cmp = 'google';
    });

    it('laisse le message de Google recueillir le choix', () => {
      const service = build();

      expect(service.usesGoogleCmp).toBe(true);
      expect(service.bannerVisible()).toBe(false);
      expect(service.adsAllowed()).toBe(true);
      expect(gtagCalls()).toEqual([]);
    });

    it('rouvre le message de Google pour changer d avis', () => {
      const service = build();
      const showRevocationMessage = vi.fn();

      service.openPreferences();
      const googlefc = (
        window as unknown as {
          googlefc: {
            callbackQueue: (() => void)[];
            showRevocationMessage?: () => void;
          };
        }
      ).googlefc;
      googlefc.showRevocationMessage = showRevocationMessage;
      googlefc.callbackQueue.forEach((callback) => callback());

      expect(showRevocationMessage).toHaveBeenCalled();
      expect(service.preferencesOpen()).toBe(false);
    });

    it('reprend une file d attente deja creee par Google', () => {
      const callbackQueue: unknown[] = ['existant'];
      (window as unknown as { googlefc: object }).googlefc = { callbackQueue };

      build().openPreferences();

      expect(callbackQueue).toHaveLength(2);
    });

    it('ne plante pas si le message n est pas disponible', () => {
      build().openPreferences();
      const googlefc = (
        window as unknown as { googlefc: { callbackQueue: (() => void)[] } }
      ).googlefc;

      expect(() => googlefc.callbackQueue[0]()).not.toThrow();
    });

    it('n envoie aucun signal lors d un enregistrement', () => {
      build().acceptAll();

      expect(gtagCalls()).toEqual([]);
    });
  });

  describe('bandeau de l application', () => {
    beforeEach(() => {
      ads.enabled = true;
      ads.cmp = 'internal';
    });

    it('affiche le bandeau tant qu aucun choix n est fait', () => {
      const service = build();

      expect(service.choice()).toBeNull();
      expect(service.bannerVisible()).toBe(true);
    });

    it('refuse tout par defaut aupres de Google', () => {
      build();

      expect(gtagCalls()[0]).toEqual([
        'consent',
        'default',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500,
        },
      ]);
    });

    it('enregistre une acceptation et la transmet', () => {
      const service = build();

      service.acceptAll();

      expect(service.adsAllowed()).toBe(true);
      expect(service.bannerVisible()).toBe(false);
      expect(JSON.parse(localStorage.getItem('consent')!)).toMatchObject({
        ads: true,
        version: CONSENT_VERSION,
      });
      expect(gtagCalls().at(-1)).toEqual([
        'consent',
        'update',
        expect.objectContaining({
          ad_storage: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'denied',
        }),
      ]);
    });

    it('enregistre un refus', () => {
      const service = build();

      service.rejectAll();

      expect(service.adsAllowed()).toBe(false);
      expect(service.bannerVisible()).toBe(false);
      expect(gtagCalls().at(-1)?.[2]).toMatchObject({ ad_storage: 'denied' });
    });

    it('reprend un choix recent et le transmet des le demarrage', () => {
      store({ ads: true, date: new Date().toISOString(), version: 1 });

      const service = build();

      expect(service.adsAllowed()).toBe(true);
      expect(service.bannerVisible()).toBe(false);
      expect(gtagCalls().at(-1)?.[1]).toBe('update');
    });

    it('redemande un choix trop ancien', () => {
      const old = new Date(Date.now() - CONSENT_MAX_AGE_MS - 1000);
      store({ ads: true, date: old.toISOString(), version: 1 });

      expect(build().choice()).toBeNull();
    });

    it('redemande un choix date du futur', () => {
      const future = new Date(Date.now() + 60_000);
      store({ ads: true, date: future.toISOString(), version: 1 });

      expect(build().choice()).toBeNull();
    });

    it('redemande un choix d une version precedente', () => {
      store({ ads: true, date: new Date().toISOString(), version: 0 });

      expect(build().choice()).toBeNull();
    });

    it('ignore un choix mal forme', () => {
      store({ ads: 'oui', date: new Date().toISOString(), version: 1 });

      expect(build().choice()).toBeNull();
    });

    it('ignore un stockage illisible', () => {
      localStorage.setItem('consent', '{pas du json');

      expect(build().choice()).toBeNull();
    });

    it('garde le choix pour la session si le stockage est refuse', () => {
      const service = build();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });

      service.acceptAll();

      expect(service.adsAllowed()).toBe(true);
    });

    it('rouvre puis referme les preferences', () => {
      const service = build();
      service.rejectAll();

      service.openPreferences();
      expect(service.bannerVisible()).toBe(true);

      service.closePreferences();
      expect(service.bannerVisible()).toBe(false);
    });

    it('recharge la page quand un consentement est retire', () => {
      const service = build();
      const reload = vi
        .spyOn(service, 'reload')
        .mockImplementation(() => undefined);
      service.acceptAll();

      service.rejectAll();

      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('ne recharge pas pour un simple refus', () => {
      const service = build();
      const reload = vi
        .spyOn(service, 'reload')
        .mockImplementation(() => undefined);

      service.rejectAll();

      expect(reload).not.toHaveBeenCalled();
    });

    it('recharge le document', () => {
      const reload = vi.fn();
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: DOCUMENT,
            useValue: { location: { reload }, defaultView: window },
          },
        ],
      });
      const service = TestBed.inject(ConsentService);

      service.reload();

      expect(reload).toHaveBeenCalled();
    });

    it('n affiche rien et n envoie rien au prerendu', () => {
      const service = build('server');

      expect(service.choice()).toBeNull();
      expect(service.bannerVisible()).toBe(false);

      service.acceptAll();

      expect(gtagCalls()).toEqual([]);
    });
  });
});
