import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-room-card',
  imports: [CommonModule, RouterModule, MedalsNumberPipe],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css',
})
export class RoomCardComponent {
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
  @Output() deleteEvent = new EventEmitter<void>();

  delete(): void {
    this.deleteEvent.emit();
  }
}
