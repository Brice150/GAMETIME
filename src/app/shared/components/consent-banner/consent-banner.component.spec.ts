import {
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { ConsentChoice } from '../../../core/services/consent.service';
import { ConsentService } from '../../../core/services/consent.service';
import { ConsentBannerComponent } from './consent-banner.component';

/** Doublure minimale : enregistre les choix au lieu de les stocker. */
function fakeConsent(initial: ConsentChoice | null = null) {
  const choice = signal<ConsentChoice | null>(initial);
  const preferencesOpen = signal(false);
  const saved: boolean[] = [];

  const save = (ads: boolean) => {
    saved.push(ads);
    choice.set({ ads, date: '', version: 1 });
    preferencesOpen.set(false);
  };

  return {
    saved,
    service: {
      choice,
      preferencesOpen,
      bannerVisible: computed(() => choice() === null || preferencesOpen()),
      save,
      acceptAll: () => save(true),
      rejectAll: () => save(false),
      openPreferences: () => preferencesOpen.set(true),
      closePreferences: () => preferencesOpen.set(false),
    },
  };
}

describe('ConsentBannerComponent', () => {
  let fixture: ComponentFixture<ConsentBannerComponent>;

  async function build(initial: ConsentChoice | null = null) {
    const consent = fakeConsent(initial);

    TestBed.configureTestingModule({
      imports: [ConsentBannerComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ConsentService, useValue: consent.service },
      ],
    });

    fixture = TestBed.createComponent(ConsentBannerComponent);
    await fixture.whenStable();
    return consent;
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(element().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    )!;
  }

  async function click(label: string): Promise<void> {
    button(label).click();
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('propose de refuser aussi simplement que d accepter', async () => {
    await build();

    expect(button('Tout refuser')).toBeTruthy();
    expect(button('Tout accepter')).toBeTruthy();
    expect(button('Tout refuser').className).toBe(
      button('Tout accepter').className,
    );
  });

  it('enregistre un refus global', async () => {
    const consent = await build();

    await click('Tout refuser');

    expect(consent.saved).toEqual([false]);
    expect(element().querySelector('.consent')).toBeNull();
  });

  it('enregistre une acceptation globale', async () => {
    const consent = await build();

    await click('Tout accepter');

    expect(consent.saved).toEqual([true]);
  });

  it('laisse choisir finalite par finalite, tout decoche par defaut', async () => {
    const consent = await build();

    await click('Personnaliser');

    expect(fixture.componentInstance.adsDraft()).toBe(false);
    fixture.componentInstance.adsDraft.set(true);
    await click('Enregistrer mes choix');

    expect(consent.saved).toEqual([true]);
    expect(fixture.componentInstance.details()).toBe(false);
  });

  it('repart du choix enregistre quand on rouvre les preferences', async () => {
    const consent = await build({ ads: true, date: '', version: 1 });
    consent.service.openPreferences();
    await fixture.whenStable();

    await click('Personnaliser');

    expect(fixture.componentInstance.adsDraft()).toBe(true);
  });

  it('se ferme sans rien changer une fois un choix fait', async () => {
    const consent = await build({ ads: false, date: '', version: 1 });
    consent.service.openPreferences();
    await fixture.whenStable();

    (element().querySelector('.close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(consent.saved).toEqual([]);
    expect(element().querySelector('.consent')).toBeNull();
  });

  it('ne propose pas de fermer avant le premier choix', async () => {
    await build();

    expect(element().querySelector('.close')).toBeNull();
  });
});
