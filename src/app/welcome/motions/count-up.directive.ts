import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
} from '@angular/core';
import { prefersReducedMotion } from './motion-player';

export const COUNT_DURATION = 1100;
export const COUNT_DELAY = 250;

// Fait defiler un chiffre jusqu'a sa valeur quand il entre dans l'ecran.
// Le gabarit porte deja la valeur finale : c'est elle qu'affichent le
// prerendu et un navigateur qui reduit les animations.
@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective {
  readonly appCountUp = input.required<number>();
  readonly countFrom = input(0);
  readonly countSuffix = input('');

  private readonly host = inject(ElementRef<HTMLElement>)
    .nativeElement as HTMLElement;
  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    afterNextRender(() => {
      if (
        prefersReducedMotion() ||
        typeof IntersectionObserver === 'undefined'
      ) {
        return;
      }

      this.render(this.countFrom());
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            this.count();
          }
        },
        { threshold: 0.6 },
      );
      observer.observe(this.host);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(this.frame);
      });
    });
  }

  private count(): void {
    const from = this.countFrom();
    const to = this.appCountUp();
    const start = performance.now() + COUNT_DELAY;

    const tick = (now: number): void => {
      const progress = Math.min(Math.max((now - start) / COUNT_DURATION, 0), 1);
      // Ralentit a l'approche de la valeur, comme un compteur qui s'arrete.
      const eased = 1 - Math.pow(1 - progress, 3);
      this.render(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        this.frame = requestAnimationFrame(tick);
      }
    };

    this.frame = requestAnimationFrame(tick);
  }

  private render(value: number): void {
    this.host.textContent = `${value}${this.countSuffix()}`;
  }
}
