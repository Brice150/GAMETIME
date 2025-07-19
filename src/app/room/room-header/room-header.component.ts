import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-room-header',
  imports: [CommonModule],
  templateUrl: './room-header.component.html',
  styleUrl: './room-header.component.css',
})
export class RoomHeaderComponent {
  room = input.required<Room>();
  medalsNumber = input.required<number>();
}
