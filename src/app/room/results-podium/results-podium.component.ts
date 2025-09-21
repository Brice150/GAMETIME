import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { DurationBetweenDatesPipe } from 'src/app/shared/pipes/duration.pipe';

@Component({
  selector: 'app-results-podium',
  imports: [CommonModule, DurationBetweenDatesPipe],
  templateUrl: './results-podium.component.html',
  styleUrl: './results-podium.component.css',
})
export class ResultsPodiumComponent {
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
  @Output() deleteEvent = new EventEmitter<Player>();

  delete(player: Player): void {
    this.deleteEvent.emit(player);
  }

  getWinsCount(player: Player): number {
    return player.currentRoomWins.filter((win) => !!win).length;
  }
}
