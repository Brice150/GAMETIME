import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-results-details',
  imports: [CommonModule],
  templateUrl: './results-details.component.html',
  styleUrl: './results-details.component.css',
})
export class ResultsDetailsComponent {
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
  otherPlayer = computed(() =>
    this.players()?.find((p) => p.userId !== this.player().userId)
  );
}
