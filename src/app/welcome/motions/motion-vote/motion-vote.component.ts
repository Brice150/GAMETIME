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

export interface VoteGame {
  id: string;
  label: string;
  icon: string;
}

export const ANY_GAME = 'any';
export const VOTE_GAMES: VoteGame[] = [
  { id: 'motus', label: 'Motus', icon: 'bxs-objects-horizontal-left' },
  { id: 'anagrams', label: 'Anagrammes', icon: 'bx-shuffle' },
  { id: 'flags', label: 'Drapeaux', icon: 'bxs-flag' },
  { id: 'capitals', label: 'Capitales', icon: 'bxs-landmark' },
  { id: 'brands', label: 'Marques', icon: 'bxs-package' },
  { id: 'elements', label: 'Éléments', icon: 'bx-atom' },
  { id: ANY_GAME, label: 'Peu importe', icon: 'bx-dots-horizontal-rounded' },
];
export const VOTERS = ['🐱', '🦊', '🐧', '🐼'];
// [votant, jeu], dans l'ordre ou les voix arrivent.
export const VOTES: [number, string][] = [
  [1, 'capitals'],
  [2, 'flags'],
  [3, ANY_GAME],
  [0, 'capitals'],
];

// Vote du prochain jeu : les voix tombent, le jeu en tete se detache, et le
// bouton de lancement s'ouvre regle sur lui.
@Component({
  selector: 'app-motion-vote',
  templateUrl: './motion-vote.component.html',
  styleUrls: ['../motion-stage.css', './motion-vote.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Vote du prochain jeu : les joueurs votent et Capitales l’emporte',
  },
})
export class MotionVoteComponent implements MotionScript {
  readonly games = VOTE_GAMES;
  readonly voters = VOTERS;
  readonly cast = signal<[number, string][]>([]);
  readonly launched = signal(false);

  readonly counts = computed(() => {
    const counts: Record<string, number> = {};
    for (const [, game] of this.cast()) {
      counts[game] = (counts[game] ?? 0) + 1;
    }
    return counts;
  });

  // A egalite, le premier jeu a avoir atteint le score reste en tete ;
  // « peu importe » ne gagne jamais.
  readonly leader = computed(() => {
    const running: Record<string, number> = {};
    let leader: string | null = null;
    for (const [, game] of this.cast()) {
      running[game] = (running[game] ?? 0) + 1;
      if (game !== ANY_GAME && (!leader || running[game] > running[leader])) {
        leader = game;
      }
    }
    return leader;
  });

  readonly leaderLabel = computed(
    () => this.games.find((game) => game.id === this.leader())?.label,
  );

  constructor() {
    startMotion(this);
  }

  reset(): void {
    this.cast.set([]);
    this.launched.set(false);
  }

  async play(step: MotionStep): Promise<void> {
    for (const vote of VOTES) {
      await step.wait(750);
      this.cast.update((cast) => [...cast, vote]);
    }
    await step.wait(700);
    this.launched.set(true);
  }

  hasVoted(voter: number): boolean {
    return this.cast().some(([who]) => who === voter);
  }
}
