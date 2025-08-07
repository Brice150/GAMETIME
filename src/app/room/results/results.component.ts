import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { DurationBetweenDatesPipe } from 'src/app/shared/pipes/duration.pipe';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-results',
  imports: [CommonModule, DurationBetweenDatesPipe, MedalsNumberPipe],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent {
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
}
