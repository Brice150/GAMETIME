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

export type LetterState = 'wellPlaced' | 'wrongPlaced' | 'absent';

export interface Puzzle {
  game: string;
  icon: string;
  clue: string;
  target: string;
  guesses: string[];
}

interface Attempt {
  word: string;
  states: LetterState[];
  revealed: number;
}

// Un tour par jeu : seul l'enonce change, la grille reste la meme.
export const PUZZLES: Puzzle[] = [
  {
    game: 'Motus',
    icon: 'bxs-objects-horizontal-left',
    clue: 'Première lettre offerte',
    target: 'SUCRE',
    guesses: ['SOUPE', 'SUITE', 'SUCRE'],
  },
  {
    game: 'Capitales',
    icon: 'bxs-landmark',
    clue: 'Italie',
    target: 'ROME',
    guesses: ['RIGA', 'ROME'],
  },
  {
    game: 'Anagrammes',
    icon: 'bx-shuffle',
    clue: 'N · I · C · H · E',
    target: 'CHIEN',
    guesses: ['CHINE', 'CHIEN'],
  },
  {
    game: 'Éléments',
    icon: 'bx-atom',
    clue: 'Fe',
    target: 'FER',
    guesses: ['FEU', 'FER'],
  },
];

// Regle du jeu : bien place d'abord, puis mal place tant que la lettre reste
// disponible dans le mot, pour ne pas signaler deux fois la meme.
export function scoreGuess(guess: string, target: string): LetterState[] {
  const states: LetterState[] = guess.split('').map(() => 'absent');
  const left: string[] = [];

  guess.split('').forEach((letter, index) => {
    if (letter === target[index]) {
      states[index] = 'wellPlaced';
    } else {
      left.push(target[index]);
    }
  });

  guess.split('').forEach((letter, index) => {
    const spare = left.indexOf(letter);
    if (states[index] !== 'wellPlaced' && spare >= 0) {
      states[index] = 'wrongPlaced';
      left.splice(spare, 1);
    }
  });

  return states;
}

@Component({
  selector: 'app-motion-grid',
  templateUrl: './motion-grid.component.html',
  styleUrls: ['../motion-stage.css', './motion-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Grille de jeu : les essais se colorent lettre par lettre, d’un jeu du catalogue à l’autre',
  },
})
export class MotionGridComponent implements MotionScript {
  private plays = 0;
  readonly round = signal(0);
  readonly puzzle = computed(() => PUZZLES[this.round()]);
  readonly typed = signal(PUZZLES[0].target[0]);
  readonly attempts = signal<Attempt[]>([]);
  readonly solved = signal(false);

  // Cases de la saisie : les lettres tapees, puis des tirets.
  readonly input = computed(() =>
    this.puzzle()
      .target.split('')
      .map((letter, index) => this.typed()[index] ?? ''),
  );

  constructor() {
    startMotion(this);
  }

  // Chaque nouveau tour passe au jeu suivant du catalogue.
  reset(): void {
    this.round.set(this.plays % PUZZLES.length);
    this.plays++;
    this.typed.set(this.puzzle().target[0]);
    this.attempts.set([]);
    this.solved.set(false);
  }

  async play(step: MotionStep): Promise<void> {
    const { target, guesses } = this.puzzle();

    for (const guess of guesses) {
      for (let length = 2; length <= guess.length; length++) {
        await step.wait(120);
        this.typed.set(guess.slice(0, length));
      }
      await step.wait(260);
      this.typed.set(target[0]);
      this.attempts.update((attempts) => [
        { word: guess, states: scoreGuess(guess, target), revealed: 0 },
        ...attempts,
      ]);
      for (let revealed = 1; revealed <= guess.length; revealed++) {
        await step.wait(150);
        this.attempts.update(([last, ...rest]) => [
          { ...last, revealed },
          ...rest,
        ]);
      }
      await step.wait(450);
    }

    this.solved.set(true);
  }
}
