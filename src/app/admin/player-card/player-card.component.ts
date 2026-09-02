import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { games } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';

@Component({
  selector: 'app-player-card',
  imports: [CommonModule, MedalsNumberPipe, TotalMedalsNumberPipe],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.css',
})
export class PlayerCardComponent {
  player = input.required<Player>();
  games = games;
  @Output() updateEvent = new EventEmitter<Player>();

  get friendsNumber(): number {
    return this.player().friendIds?.length ?? 0;
  }

  update(): void {
    this.updateEvent.emit(this.player());
  }
}
