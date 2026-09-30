import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timestamp } from '@angular/fire/firestore';
import { interval } from 'rxjs';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { FlipDirective } from '../../shared/directives/flip.directive';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

// Le chrono affiche les dixiemes : rafraichi plus lentement, le chiffre
// sautait de deux en deux.
const TICK_MS = 100;
// Au-dela, une pastille par lettre ne tient plus sur la ligne : le compte
// s'affiche en chiffres.
export const MAX_LETTER_DOTS = 10;

export type LetterDot = 'found' | 'misplaced' | 'empty';

@Component({
  selector: 'app-live-standings',
  imports: [CommonModule, DurationPipe, FlipDirective],
  templateUrl: './live-standings.component.html',
  styleUrl: './live-standings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStandingsComponent implements OnInit {
  private localStorageService = inject(LocalStorageService);
  readonly room = input.required<Room>();
  readonly players = input.required<Player[]>();
  readonly currentPlayerId = input<string | undefined>(undefined);
  readonly elapsedMs = signal<number | null>(null);

  // Pendant la partie, on se classe a l'avancee, pas au score : la manche
  // atteinte, puis les lettres trouvees. Le score n'est revele qu'aux
  // resultats, ou le plus rapide n'est pas forcement le mieux classe.
  readonly standings = computed(() => {
    const total = this.room().responses?.length ?? 0;
    const currentPlayerId = this.currentPlayerId();

    return [...this.players()]
      .sort((a, b) => this.compare(a, b))
      .map((player, index) => {
        const progress = this.currentProgress(player);
        const found = progress?.lettersFound ?? 0;
        const misplaced = progress?.lettersMisplaced ?? 0;

        return {
          player,
          rank: index + 1,
          wins: player.currentRoomWins.filter(Boolean).length,
          step: Math.min(player.currentRoomWins.length + 1, total),
          total,
          lettersLabel: progress
            ? `${progress.lettersFound}/${progress.lettersTotal} lettres`
            : null,
          // Une pastille par lettre du mot : verte si trouvee, rouge si reperee
          // mais mal placee. Les vertes passent devant.
          letterDots:
            progress && progress.lettersTotal <= MAX_LETTER_DOTS
              ? Array.from(
                  { length: progress.lettersTotal },
                  (unused, index): LetterDot =>
                    index < found
                      ? 'found'
                      : index < found + misplaced
                        ? 'misplaced'
                        : 'empty',
                )
              : null,
          isMe: !!currentPlayerId && player.userId === currentPlayerId,
        };
      });
  });

  // La manche du joueur lui-meme, en tete du classement.
  readonly myStep = computed(
    () => this.standings().find((entry) => entry.isMe)?.step ?? null,
  );

  constructor() {
    interval(TICK_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.elapsedMs.set(this.readElapsed()));
  }

  ngOnInit(): void {
    this.elapsedMs.set(this.readElapsed());
  }

  private compare(a: Player, b: Player): number {
    const rounds = b.currentRoomWins.length - a.currentRoomWins.length;
    if (rounds) {
      return rounds;
    }

    // Tous deux au bout : le premier arrive devant.
    if (a.finishDate && b.finishDate) {
      return (a.durationMs ?? Infinity) - (b.durationMs ?? Infinity);
    }

    const progressA = this.currentProgress(a);
    const progressB = this.currentProgress(b);
    return (
      (progressB?.lettersFound ?? 0) - (progressA?.lettersFound ?? 0) ||
      (progressB?.lettersMisplaced ?? 0) - (progressA?.lettersMisplaced ?? 0)
    );
  }

  private currentProgress(player: Player) {
    const progress = player.currentRoundProgress;

    if (
      player.finishDate ||
      !progress ||
      !progress.lettersTotal ||
      progress.stepIndex !== player.currentRoomWins.length
    ) {
      return null;
    }

    return progress;
  }

  private readElapsed(): number | null {
    const room = this.room();
    const local = this.localStorageService.getElapsedMs(
      room.id!,
      room.startAgainNumber,
    );

    if (local !== null) {
      return local;
    }

    const startDate =
      room.startDate instanceof Timestamp
        ? room.startDate.toDate()
        : room.startDate;

    return startDate ? Math.max(0, Date.now() - startDate.getTime()) : null;
  }
}
