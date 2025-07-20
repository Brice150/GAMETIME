import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-results',
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent {
  room = input.required<Room>();
  player = input.required<Player>();

  get sortedPlayersRoom() {
    const room = this.room();
    if (!room || !room.playersRoom) return [];

    return [...room.playersRoom].sort((a, b) => {
      const aTrueCount = a.currentRoomWins.filter(Boolean).length;
      const bTrueCount = b.currentRoomWins.filter(Boolean).length;
      return bTrueCount - aTrueCount;
    });
  }
}
