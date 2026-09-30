import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COUNT_DELAY,
  COUNT_DURATION,
  CountUpDirective,
} from './count-up.directive';

@Component({
  imports: [CountUpDirective],
  template: `
    <span [appCountUp]="6">6</span>
    <span [appCountUp]="0" [countFrom]="30" countSuffix=" €">0 €</span>
  `,
})
class CountHost {}

describe('CountUpDirective', () => {
  // Un observateur par chiffre.
  let callbacks: IntersectionObserverCallback[];
  let frames: FrameRequestCallback[];
  const disconnect = vi.fn();

  async function build(): Promise<ComponentFixture<CountHost>> {
    const fixture = TestBed.createComponent(CountHost);
    await fixture.whenStable();
    return fixture;
  }

  function texts(fixture: ComponentFixture<CountHost>): string[] {
    return [...fixture.nativeElement.querySelectorAll('span')].map(
      (span: HTMLElement) => span.textContent ?? '',
    );
  }

  // Fait entrer (ou non) tous les chiffres dans l'ecran. Les images deja
  // demandees viennent d'Angular lui-meme : seules comptent les suivantes.
  function intersect(isIntersecting: boolean): void {
    frames = [];
    callbacks.forEach((callback) =>
      callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  }

  // Fait avancer toutes les animations en attente jusqu'a l'instant donne.
  function runFrames(at: number): void {
    const pending = frames;
    frames = [];
    pending.forEach((frame) => frame(at));
  }

  beforeEach(() => {
    callbacks = [];
    frames = [];
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => {
      frames.push(frame);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(next: IntersectionObserverCallback) {
          callbacks.push(next);
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('repart de la valeur de depart en attendant d etre vu', async () => {
    const fixture = await build();

    expect(texts(fixture)).toEqual(['0', '30 €']);
  });

  it('ne compte pas tant que le chiffre est hors de l ecran', async () => {
    const fixture = await build();

    intersect(false);

    expect(frames).toHaveLength(0);
    expect(texts(fixture)).toEqual(['0', '30 €']);
  });

  it('defile jusqu a la valeur finale une fois visible', async () => {
    const fixture = await build();

    intersect(true);
    runFrames(0);
    expect(texts(fixture)).toEqual(['0', '30 €']);

    runFrames(COUNT_DELAY + COUNT_DURATION / 2);
    const [halfway] = texts(fixture);
    expect(Number(halfway)).toBeGreaterThan(0);
    expect(Number(halfway)).toBeLessThan(6);

    runFrames(COUNT_DELAY + COUNT_DURATION);
    expect(texts(fixture)).toEqual(['6', '0 €']);
    expect(frames).toHaveLength(0);
    expect(disconnect).toHaveBeenCalled();
  });

  it('arrete l animation a la destruction', async () => {
    const fixture = await build();

    fixture.destroy();

    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('laisse la valeur finale si l utilisateur reduit les animations', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    const fixture = await build();

    expect(texts(fixture)).toEqual(['6', '0 €']);
  });

  it('laisse la valeur finale sans observateur', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const fixture = await build();

    expect(texts(fixture)).toEqual(['6', '0 €']);
  });

  it('ne touche a rien au prerendu', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = await build();

    expect(callbacks).toHaveLength(0);
    expect(texts(fixture)).toEqual(['6', '0 €']);
  });
});
