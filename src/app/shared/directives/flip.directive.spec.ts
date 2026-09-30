import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLIP_DURATION, FlipDirective } from './flip.directive';

@Component({
  imports: [FlipDirective],
  template: `
    <ul [appFlip]="order()">
      @for (name of order(); track name) {
        <li>{{ name }}</li>
      }
    </ul>
  `,
})
class FlipHost {
  readonly order = signal(['a', 'b', 'c']);
}

// jsdom ne met rien en page : a la premiere mesure, toutes les lignes sont en
// haut. Ensuite, chacune annonce sa place d'apres son rang, 40 px par ligne.
function layOut(list: HTMLElement): void {
  list.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  Array.from(list.children).forEach((child) => {
    child.getBoundingClientRect = () =>
      ({ top: 100 + Array.from(list.children).indexOf(child) * 40 }) as DOMRect;
  });
}

describe('FlipDirective', () => {
  const animate = vi.fn();

  afterEach(() => {
    animate.mockReset();
    delete (Element.prototype as Partial<Element>).animate;
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  async function reorder(withAnimate = true): Promise<void> {
    if (withAnimate) {
      Element.prototype.animate = animate;
    }
    const fixture = TestBed.createComponent(FlipHost);
    await fixture.whenStable();
    layOut(fixture.nativeElement.querySelector('ul'));

    fixture.componentInstance.order.set(['c', 'a', 'b']);
    await fixture.whenStable();
  }

  it('fait glisser une ligne depuis son ancienne place', async () => {
    await reorder();

    // « a » etait en haut, il est maintenant deuxieme : il part de 40 px
    // plus haut.
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translateY(-40px)' }, { transform: 'none' }],
      expect.objectContaining({ duration: FLIP_DURATION }),
    );
    // « c » arrive en haut, la ou toutes les lignes etaient mesurees.
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('ne bouge rien si l utilisateur reduit les animations', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    await reorder();

    expect(animate).not.toHaveBeenCalled();
  });

  it('se contente de replacer les lignes sans Web Animations', async () => {
    await expect(reorder(false)).resolves.toBeUndefined();
  });
});
