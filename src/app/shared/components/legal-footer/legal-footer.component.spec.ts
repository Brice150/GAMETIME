import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsentService } from '../../../core/services/consent.service';
import { LegalFooterComponent } from './legal-footer.component';

describe('LegalFooterComponent', () => {
  const openPreferences = vi.fn();

  async function build(required: boolean): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [LegalFooterComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ConsentService, useValue: { required, openPreferences } },
      ],
    });

    const fixture = TestBed.createComponent(LegalFooterComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    openPreferences.mockClear();
    TestBed.resetTestingModule();
  });

  it('renvoie vers chaque document legal', async () => {
    const element = await build(false);

    const links = Array.from(element.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual([
      '/infos/mentions-legales',
      '/infos/cgu',
      '/infos/confidentialite',
      '/infos/cookies',
    ]);
  });

  it('ne propose de gerer les cookies que s il y en a a gerer', async () => {
    expect((await build(false)).querySelector('button')).toBeNull();
  });

  it('rouvre le choix des cookies', async () => {
    const element = await build(true);

    element.querySelector('button')!.click();

    expect(openPreferences).toHaveBeenCalled();
  });
});
