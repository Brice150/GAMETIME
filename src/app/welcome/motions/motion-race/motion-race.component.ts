import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  startMotion,
  type MotionScript,
  type MotionStep,
} from '../motion-player';

export interface Racer {
  name: string;
  animal: string;
  // Cases du mot dans l'ordre ou le joueur les trouve : comme en partie, la
  // pastille s'allume a la place de la lettre dans le mot.
  letters: number[];
}

export const RACERS: Racer[] = [
  { name: 'Vous', animal: '🐱', letters: [2, 0, 4, 1, 3] },
  { name: 'Léa', animal: '🦊', letters: [0, 3, 1, 4, 2] },
  { name: 'Tom', animal: '🐧', letters: [4, 1, 2, 0, 3] },
];
export const WORD_LENGTH = 5;
// Qui trouve une lettre, dans l'ordre : Lea mene, puis se fait doubler.
export const RACE_EVENTS = [1, 2, 1, 0, 0, 1, 0, 2, 0, 1, 0, 2, 1, 2];
export const SECONDS_PER_EVENT = 3;

// Classement en direct d'une manche multijoueur : chaque lettre trouvee fait
// avancer une ligne, et les lignes se doublent.
@Component({
  selector: 'app-motion-race',
  templateUrl: './motion-race.component.html',
  styleUrls: ['../motion-stage.css', './motion-race.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Classement en direct : trois joueurs trouvent les lettres du mot et se doublent',
  },
})
export class MotionRaceComponent implements MotionScript {
  readonly racers = RACERS;
  readonly slots = Array.from({ length: WORD_LENGTH });
  readonly found = signal<number[]>(RACERS.map(() => 0));
  // Moment ou chacun a atteint son score : a egalite, le premier arrive
  // reste devant.
  readonly stamps = signal<number[]>(RACERS.map(() => 0));
  readonly finishers = signal<number[]>([]);
  readonly seconds = signal(0);
  // Fige le temps du vainqueur : le chronometre, lui, continue.
  readonly winTime = signal<string | null>(null);

  readonly positions = computed(() => {
    const found = this.found();
    const stamps = this.stamps();
    const order = this.racers
      .map((racer, index) => index)
      .sort((a, b) => found[b] - found[a] || stamps[a] - stamps[b]);
    return this.racers.map((racer, index) => order.indexOf(index));
  });

  readonly clock = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  constructor() {
    startMotion(this);
  }

  reset(): void {
    this.found.set(RACERS.map(() => 0));
    this.stamps.set(RACERS.map(() => 0));
    this.finishers.set([]);
    this.seconds.set(0);
    this.winTime.set(null);
  }

  async play(step: MotionStep): Promise<void> {
    for (const [index, racer] of RACE_EVENTS.entries()) {
      await step.wait(650);
      this.score(racer, index + 1);
    }
  }

  score(racer: number, stamp: number): void {
    const found = this.found()[racer] + 1;
    this.found.update((all) =>
      all.map((value, i) => (i === racer ? found : value)),
    );
    this.stamps.update((all) =>
      all.map((value, i) => (i === racer ? stamp : value)),
    );
    this.seconds.update((seconds) => seconds + SECONDS_PER_EVENT);
    if (found === WORD_LENGTH) {
      if (!this.finishers().length) {
        this.winTime.set(this.clock());
      }
      this.finishers.update((finishers) => [...finishers, racer]);
    }
  }

  isFound(racer: number, slot: number): boolean {
    return this.racers[racer].letters
      .slice(0, this.found()[racer])
      .includes(slot);
  }

  // Or pour le premier a finir, argent pour le second.
  trophy(racer: number): string | null {
    const place = this.finishers().indexOf(racer);
    return place < 0 ? null : place === 0 ? 'gold' : 'silver';
  }
}
