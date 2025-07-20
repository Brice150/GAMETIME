import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { DurationBetweenDatesPipe } from 'src/app/shared/pipes/duration.pipe';

@Component({
  selector: 'app-results',
  imports: [CommonModule, DurationBetweenDatesPipe],
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

      if (bTrueCount !== aTrueCount) {
        return bTrueCount - aTrueCount;
      }

      const aFinish = this.toJsDate(a.finishDate).getTime();
      const bFinish = this.toJsDate(b.finishDate).getTime();

      return aFinish - bFinish;
    });
  }

  toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }
}
