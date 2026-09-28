import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { AdService } from './ad.service';
import { ConsentService } from './consent.service';

interface Ads {
  client: string;
}

describe('AdService', () => {
  const ads = environment.ads as Ads;
  let client: string;
  const adsAllowed = signal(true);

  function build(platform = 'browser'): AdService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: ConsentService, useValue: { adsAllowed } },
      ],
    });
    return TestBed.inject(AdService);
  }

  function scripts(): HTMLScriptElement[] {
    return Array.from(
      document.head.querySelectorAll<HTMLScriptElement>(
        'script[src*="adsbygoogle"]',
      ),
    );
  }

  beforeEach(() => {
    client = ads.client;
    ads.client = 'ca-pub-123';
    adsAllowed.set(true);
    scripts().forEach((script) => script.remove());
    delete (window as unknown as { adsbygoogle?: unknown }).adsbygoogle;
  });

  afterEach(() => {
    ads.client = client;
    TestBed.resetTestingModule();
  });

  it('charge AdSense une seule fois apres consentement', () => {
    const service = build();

    service.load();
    service.load();

    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].src).toContain('client=ca-pub-123');
    expect(scripts()[0].async).toBe(true);
  });

  it('ne charge rien sans consentement', () => {
    adsAllowed.set(false);
    const service = build();

    service.load();

    expect(service.ready()).toBe(false);
    expect(scripts()).toHaveLength(0);
  });

  it('ne charge rien sans identifiant editeur', () => {
    ads.client = '';

    expect(build().ready()).toBe(false);
  });

  it('ne charge rien au prerendu', () => {
    expect(build('server').ready()).toBe(false);
  });

  it('demande le remplissage d un bloc', () => {
    const service = build();

    service.fill();
    service.fill();

    expect(
      (window as unknown as { adsbygoogle: object[] }).adsbygoogle,
    ).toEqual([{}, {}]);
  });
});
