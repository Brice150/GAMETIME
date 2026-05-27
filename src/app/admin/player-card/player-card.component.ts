import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { games } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { MedalsNumberPipe } from '../../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-player-card',
  imports: [CommonModule, MedalsNumberPipe],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.css',
})
export class PlayerCardComponent {
  player = input.required<Player>();
  playerForm!: FormGroup;
  fb = inject(FormBuilder);
  games = games;
  @Output() updateEvent = new EventEmitter<void>();

  update(): void {
    this.updateEvent.emit();
  }
}
