import {
  afterRenderEffect,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export const FLIP_DURATION = 480;

// Anime les enfants d'une liste qui change d'ordre : chaque ligne part de
// son ancienne place et glisse jusqu'a la nouvelle, au lieu d'y sauter.
// `appFlip` recoit ce qui ordonne la liste : chaque changement relance la
// comparaison. Les positions sont prises par rapport a la liste, pour qu'un
// defilement de la page ne passe pas pour un deplacement.
@Directive({
  selector: '[appFlip]',
})
export class FlipDirective {
  readonly appFlip = input.required<unknown>();

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private positions = new Map<Element, number>();

  constructor() {
    // Apres le rendu, donc jamais au prerendu.
    afterRenderEffect({
      read: () => {
        this.appFlip();
        this.play();
      },
    });
  }

  private play(): void {
    const origin = this.host.getBoundingClientRect().top;
    const next = new Map<Element, number>();
    const animate = !reducedMotion();

    for (const child of Array.from(this.host.children)) {
      const top = child.getBoundingClientRect().top - origin;
      const previous = this.positions.get(child);
      next.set(child, top);

      if (
        animate &&
        previous !== undefined &&
        previous !== top &&
        typeof child.animate === 'function'
      ) {
        child.animate(
          [
            { transform: `translateY(${previous - top}px)` },
            { transform: 'none' },
          ],
          { duration: FLIP_DURATION, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      }
    }

    this.positions = next;
  }
}

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
