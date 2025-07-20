import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-waiting-room',
  imports: [CommonModule],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css',
})
export class WaitingRoomComponent {
  room = input.required<Room>();
  player = input.required<Player>();
}
