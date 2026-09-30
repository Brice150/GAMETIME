import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MOTION_LOOP_PAUSE,
  MotionCancelled,
  MotionPlayer,
  prefersReducedMotion,
  startMotion,
  type MotionScript,
  type MotionStep,
} from './motion-player';

function script(): MotionScript & { steps: MotionStep[]; resets: number } {
  const state = {
    steps: [] as MotionStep[],
    resets: 0,
    reset(): void {
      state.resets++;
    },
    async play(step: MotionStep): Promise<void> {
      state.steps.push(step);
      await step.wait(100);
    },
  };

  return state;
}

describe('MotionPlayer', () => {
  let callback: IntersectionObserverCallback | undefined;
  const disconnect = vi.fn();

  function intersect(isIntersecting: boolean): void {
    callback?.(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    callback = undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(next: IntersectionObserverCallback) {
          callback = next;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('attend d entrer dans l ecran pour jouer', async () => {
    const motion = script();
    new MotionPlayer(document.body, motion).start();

    expect(motion.resets).toBe(0);

    intersect(true);
    await vi.advanceTimersByTimeAsync(400);

    expect(motion.resets).toBe(1);
    expect(motion.steps).toHaveLength(1);
    expect(motion.steps[0].instant).toBe(false);
  });

  it('rejoue en boucle apres une pause', async () => {
    const motion = script();
    new MotionPlayer(document.body, motion).start();

    intersect(true);
    await vi.advanceTimersByTimeAsync(400 + 100 + MOTION_LOOP_PAUSE + 400);

    expect(motion.resets).toBe(2);
    expect(motion.steps).toHaveLength(2);
  });

  it('interrompt la scene quand elle sort de l ecran', async () => {
    const motion = script();
    new MotionPlayer(document.body, motion).start();

    intersect(true);
    await vi.advanceTimersByTimeAsync(400);
    intersect(false);
    await vi.advanceTimersByTimeAsync(MOTION_LOOP_PAUSE * 2);

    expect(motion.steps).toHaveLength(1);
    expect(motion.resets).toBe(1);
    expect(() => motion.steps[0].check()).toThrow(MotionCancelled);
  });

  it('coupe l observation a la destruction', () => {
    const player = new MotionPlayer(document.body, script());

    player.start();
    player.destroy();

    expect(disconnect).toHaveBeenCalled();
  });

  it('laisse l etat statique sans observateur', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const motion = script();

    new MotionPlayer(document.body, motion).start();

    expect(motion.resets).toBe(0);
    expect(motion.steps).toHaveLength(0);
  });

  it('joue directement l etat final si l utilisateur reduit les animations', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const motion = script();

    new MotionPlayer(document.body, motion).start();

    expect(prefersReducedMotion()).toBe(true);
    expect(motion.steps[0].instant).toBe(true);
  });
});

@Component({ template: '' })
class MotionHost implements MotionScript {
  readonly reset = vi.fn();
  readonly play = vi.fn(() => Promise.resolve());

  constructor() {
    startMotion(this);
  }
}

describe('startMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('ne demarre rien au prerendu', async () => {
    const observe = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe;
        disconnect = vi.fn();
      },
    );
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = TestBed.createComponent(MotionHost);
    await fixture.whenStable();

    expect(observe).not.toHaveBeenCalled();
  });

  it('observe la scene au navigateur et la libere a la destruction', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );

    const fixture = TestBed.createComponent(MotionHost);
    await fixture.whenStable();
    fixture.destroy();

    expect(observe).toHaveBeenCalledWith(fixture.nativeElement);
    expect(disconnect).toHaveBeenCalled();
  });
});
