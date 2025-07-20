import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-room-header',
  imports: [CommonModule],
  templateUrl: './room-header.component.html',
  styleUrl: './room-header.component.css',
})
export class RoomHeaderComponent {
  room = input.required<Room>();
  player = input.required<Player>();

  get sortedPlayersRoom() {
    const room = this.room();
    if (!room || !room.playersRoom) return [];

    return [...room.playersRoom].sort(
      (a, b) => b.currentRoomWins.length - a.currentRoomWins.length
    );
  }

  getMedalsNumber(): number {
    const stat = this.player().stats?.find(
      (stat) => stat.gameName === this.room().gameName
    );
    return stat?.medalsNumer ?? 0;
  }
}
