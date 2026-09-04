import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { voteOptions } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { VotePanelComponent } from '../vote-panel/vote-panel.component';

// Classement dans l'en-tete de colonne, detail des manches dans les lignes.
@Component({
  selector: 'app-results-board',
  imports: [CommonModule, DurationPipe, VotePanelComponent],
  templateUrl: './results-board.component.html',
  styleUrl: './results-board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsBoardComponent {
  room = input.required<Room>();
  players = input.required<Player[]>();
  currentPlayerId = input<string | undefined>(undefined);
  canVote = input(false);
  @Output() deleteEvent = new EventEmitter<Player>();
  @Output() voteEvent = new EventEmitter<string>();

  voteOptions = voteOptions;

  // Les joueurs arrivent deja tries par la page room.
  readonly standings = computed(() =>
    this.players().map((player, index) => ({
      player,
      rank: index + 1,
      wins: player.currentRoomWins.filter(Boolean).length,
      isSpectator: this.isSpectator(player),
    })),
  );

  readonly isHost = computed(
    () =>
      !!this.currentPlayerId() && this.room().userId === this.currentPlayerId(),
  );

  isSpectator(player: Player): boolean {
    const startedPlayerIds = this.room().startedPlayerIds;

    return (
      !!startedPlayerIds?.length &&
      !!player.userId &&
      !startedPlayerIds.includes(player.userId) &&
      !!player.finishDate &&
      player.currentRoomWins.length === 0
    );
  }

  vote(choice: string): void {
    this.voteEvent.emit(choice);
  }

  delete(player: Player): void {
    this.deleteEvent.emit(player);
  }
}
