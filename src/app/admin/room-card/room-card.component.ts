import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';

@Component({
  selector: 'app-room-card',
  imports: [CommonModule, RouterModule, TotalMedalsNumberPipe],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css',
})
export class RoomCardComponent {
  room = input.required<Room>();
  players = input.required<Player[]>();
  @Output() deleteEvent = new EventEmitter<void>();

  delete(): void {
    this.deleteEvent.emit();
  }
}
