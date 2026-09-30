import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';

export const MOTION_LOOP_PAUSE = 3200;
export const MOTION_THRESHOLD = 0.35;

export class MotionCancelled extends Error {
  constructor() {
    super('motion cancelled');
  }
}

export interface MotionStep {
  readonly instant: boolean;
  wait(ms: number): Promise<void>;
  check(): void;
}

export interface MotionScript {
  reset(): void;
  play(step: MotionStep): Promise<void>;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export class MotionPlayer {
  private run = 0;
  private visible = false;
  private observer?: IntersectionObserver;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private host: Element,
    private script: MotionScript,
  ) {}

  start(): void {
    if (prefersReducedMotion()) {
      this.playInstant();
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) {
          this.loop();
        } else {
          this.stop();
        }
      },
      { threshold: MOTION_THRESHOLD },
    );
    this.observer.observe(this.host);
  }

  destroy(): void {
    this.observer?.disconnect();
    this.stop();
  }

  private stop(): void {
    this.run++;
    clearTimeout(this.timer);
  }

  private playInstant(): void {
    this.script.reset();
    const step: MotionStep = {
      instant: true,
      wait: () => Promise.resolve(),
      check: () => undefined,
    };
    void this.script.play(step);
  }

  private async loop(): Promise<void> {
    this.stop();
    const id = this.run;
    const check = (): void => {
      if (id !== this.run || !this.visible) {
        throw new MotionCancelled();
      }
    };
    const step: MotionStep = {
      instant: false,
      check,
      wait: (ms) =>
        new Promise((resolve, reject) => {
          this.timer = setTimeout(() => {
            try {
              check();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, ms);
        }),
    };

    this.script.reset();
    try {
      await step.wait(400);
      await this.script.play(step);
      await step.wait(MOTION_LOOP_PAUSE);
    } catch (error) {
      if (error instanceof MotionCancelled) {
        return;
      }
      throw error;
    }
    void this.loop();
  }
}

export function startMotion(script: MotionScript): void {
  const host = inject(ElementRef<HTMLElement>);
  const destroyRef = inject(DestroyRef);

  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }

  afterNextRender(() => {
    const player = new MotionPlayer(host.nativeElement, script);
    player.start();
    destroyRef.onDestroy(() => player.destroy());
  });
}
