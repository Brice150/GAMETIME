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
import { DurationPipe } from '../../shared/pipes/duration.pipe';

// Le chrono affiche les dixiemes : rafraichi plus lentement, le chiffre
// sautait de deux en deux.
const TICK_MS = 100;

@Component({
  selector: 'app-live-standings',
  imports: [CommonModule, DurationPipe],
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

  // Les joueurs arrivent deja classes par la page room.
  readonly standings = computed(() => {
    const total = this.room().responses?.length ?? 0;
    const currentPlayerId = this.currentPlayerId();

    return this.players().map((player, index) => {
      const progress = this.currentProgress(player);

      return {
        player,
        rank: index + 1,
        wins: player.currentRoomWins.filter(Boolean).length,
        step: Math.min(player.currentRoomWins.length + 1, total),
        total,
        lettersLabel: progress
          ? `${progress.lettersFound}/${progress.lettersTotal} lettres`
          : null,
        isMe: !!currentPlayerId && player.userId === currentPlayerId,
      };
    });
  });

  constructor() {
    interval(TICK_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.elapsedMs.set(this.readElapsed()));
  }

  ngOnInit(): void {
    this.elapsedMs.set(this.readElapsed());
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
