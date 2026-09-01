import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

// Classement dans l'en-tete de colonne, detail des manches dans les lignes.
@Component({
  selector: 'app-results-board',
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    DurationPipe,
  ],
  templateUrl: './results-board.component.html',
  styleUrl: './results-board.component.css',
})
export class ResultsBoardComponent {
  room = input.required<Room>();
  players = input.required<Player[]>();
  currentPlayerId = input<string | undefined>(undefined);
  canHideResponses = input(false);
  @Output() deleteEvent = new EventEmitter<Player>();

  hideResponses = true;

  // Les joueurs arrivent deja tries par la page room.
  readonly standings = computed(() =>
    this.players().map((player, index) => ({
      player,
      rank: index + 1,
      wins: player.currentRoomWins.filter(Boolean).length,
    })),
  );

  readonly isHost = computed(
    () => !!this.currentPlayerId() && this.room().userId === this.currentPlayerId(),
  );

  delete(player: Player): void {
    this.deleteEvent.emit(player);
  }
}
