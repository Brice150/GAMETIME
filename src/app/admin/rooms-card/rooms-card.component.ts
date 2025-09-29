import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';

@Component({
  selector: 'app-rooms-card',
  imports: [
    CommonModule,
    RouterModule,
    TotalMedalsNumberPipe,
    MedalsNumberPipe,
  ],
  templateUrl: './rooms-card.component.html',
  styleUrl: './rooms-card.component.css',
})
export class RoomsCardComponent {
  selectedRoomType = input.required<string>();
  rooms = input.required<Room[]>();
  players = input.required<Player[]>();
  @Output() deleteEvent = new EventEmitter<string>();

  get filteredRooms() {
    return this.rooms().filter((room) => this.canDisplayRoom(room));
  }

  delete(roomId: string): void {
    this.deleteEvent.emit(roomId);
  }

  canDisplayRoom(room: Room): boolean {
    if (this.selectedRoomType() === 'attente') {
      return !room.isStarted;
    }

    return room.gameName === this.selectedRoomType();
  }
}
