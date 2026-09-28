import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdService } from '../../../core/services/ad.service';
import { AdSlotComponent } from './ad-slot.component';

describe('AdSlotComponent', () => {
  const load = vi.fn();
  const fill = vi.fn();

  async function build(ready: boolean, slot: string) {
    TestBed.configureTestingModule({
      imports: [AdSlotComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AdService,
          useValue: { ready: signal(ready), client: 'ca-pub-123', load, fill },
        },
      ],
    });

    const fixture = TestBed.createComponent(AdSlotComponent);
    fixture.componentRef.setInput('slot', slot);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    load.mockClear();
    fill.mockClear();
    TestBed.resetTestingModule();
  });

  it('affiche un bloc signale comme publicite et le fait remplir', async () => {
    const element = await build(true, '42');

    const ins = element.querySelector('ins.adsbygoogle')!;
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-123');
    expect(ins.getAttribute('data-ad-slot')).toBe('42');
    expect(element.textContent).toContain('Publicité');
    expect(load).toHaveBeenCalled();
    expect(fill).toHaveBeenCalled();
  });

  it('n occupe aucune place sans consentement', async () => {
    const element = await build(false, '42');

    expect(element.querySelector('ins')).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('n occupe aucune place sans identifiant de bloc', async () => {
    const element = await build(true, '');

    expect(element.querySelector('ins')).toBeNull();
    expect(fill).not.toHaveBeenCalled();
  });
});
