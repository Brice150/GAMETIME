import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-waiting-room',
  imports: [CommonModule, MatProgressSpinnerModule, MedalsNumberPipe],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css',
})
export class WaitingRoomComponent {
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
}
