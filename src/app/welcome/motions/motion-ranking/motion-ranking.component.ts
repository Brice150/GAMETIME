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

export interface Ranked {
  name: string;
  animal: string;
  medals: number;
}

export const ME = 2;
export const START_MEDALS = 1987;
export const ACHIEVEMENT_AT = 2000;
export const TOTAL_PLAYERS = 35;
export const RIVALS: Ranked[] = [
  { name: 'Bloew', animal: '🐧', medals: 1996 },
  { name: 'Gwendal', animal: '🐝', medals: 1990 },
  { name: 'Vous', animal: '🐱', medals: START_MEDALS },
  { name: 'Céline', animal: '🦋', medals: 306 },
];
// Manches gagnees : chacune rapporte des medailles et fait doubler un rival.
export const WINS: { game: string; medals: number }[] = [
  { game: 'Capitales', medals: 5 },
  { game: 'Motus', medals: 6 },
  { game: 'Drapeaux', medals: 3 },
];
const TROPHIES = ['gold', 'silver', 'bronze'];

// Progression : les medailles montent, on double ses amis au classement, et
// le palier debloque un succes.
@Component({
  selector: 'app-motion-ranking',
  templateUrl: './motion-ranking.component.html',
  styleUrls: ['../motion-stage.css', './motion-ranking.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Classement : vos médailles augmentent, vous passez premier et débloquez un succès',
  },
})
export class MotionRankingComponent implements MotionScript {
  readonly me = ME;
  readonly total = TOTAL_PLAYERS;
  readonly medals = signal(START_MEDALS);
  // Derniere manche gagnee, affichee en « +N » au-dessus de la ligne.
  readonly win = signal<{ id: number; game: string; medals: number } | null>(
    null,
  );

  readonly players = computed(() =>
    RIVALS.map((player, index) =>
      index === ME ? { ...player, medals: this.medals() } : player,
    ),
  );

  // A egalite, le rival garde sa place : il y etait avant.
  readonly positions = computed(() => {
    const players = this.players();
    const order = players
      .map((player, index) => index)
      .sort(
        (a, b) =>
          players[b].medals - players[a].medals ||
          Number(a === ME) - Number(b === ME),
      );
    return players.map((player, index) => order.indexOf(index));
  });

  readonly rank = computed(() => this.positions()[ME] + 1);
  readonly unlocked = computed(() => this.medals() >= ACHIEVEMENT_AT);

  constructor() {
    startMotion(this);
  }

  reset(): void {
    this.medals.set(START_MEDALS);
    this.win.set(null);
  }

  async play(step: MotionStep): Promise<void> {
    for (const [id, win] of WINS.entries()) {
      await step.wait(900);
      this.win.set({ id, ...win });
      for (let medal = 0; medal < win.medals; medal++) {
        await step.wait(90);
        this.medals.update((medals) => medals + 1);
      }
    }
  }

  trophy(index: number): string | null {
    return TROPHIES[this.positions()[index]] ?? null;
  }
}
