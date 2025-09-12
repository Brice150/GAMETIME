import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Player } from 'src/app/core/interfaces/player';
import { Stat } from 'src/app/core/interfaces/stat';
import { gameMap } from 'src/assets/data/games';

@Component({
  selector: 'app-player-card',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.css',
})
export class PlayerCardComponent implements OnInit {
  player = input.required<Player>();
  playerForm!: FormGroup;
  fb = inject(FormBuilder);
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  @Output() updateEvent = new EventEmitter<Player>();

  ngOnInit(): void {
    this.playerForm = this.fb.group({
      username: [
        this.player().username,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(40),
        ],
      ],
      drapeauxMedalsNumber: [
        this.player().stats.find(
          (stat) => stat.gameName === this.drapeauxGameKey
        )?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      marquesMedalsNumber: [
        this.player().stats.find(
          (stat) => stat.gameName === this.marquesGameKey
        )?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      motusMedalsNumber: [
        this.player().stats.find((stat) => stat.gameName === this.motusGameKey)
          ?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      quizMedalsNumber: [
        this.player().stats.find((stat) => stat.gameName === this.quizGameKey)
          ?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
    });
  }

  update(): void {
    if (this.playerForm.valid) {
      const statMotus: Stat = {
        gameName: this.motusGameKey,
        medalsNumber: this.playerForm.value.motusMedalsNumber,
      };
      const statDrapeaux: Stat = {
        gameName: this.drapeauxGameKey,
        medalsNumber: this.playerForm.value.drapeauxMedalsNumber,
      };
      const statMarques: Stat = {
        gameName: this.marquesGameKey,
        medalsNumber: this.playerForm.value.marquesMedalsNumber,
      };
      const statQuiz: Stat = {
        gameName: this.quizGameKey,
        medalsNumber: this.playerForm.value.quizMedalsNumber,
      };

      const updatedPlayer: Player = {
        ...this.player(),
        username: this.playerForm.value.username,
        stats: [statMotus, statDrapeaux, statMarques, statQuiz],
      };
      this.updateEvent.emit(updatedPlayer);
      this.playerForm.markAsPristine();
    } else {
      this.playerForm.markAllAsTouched();
    }
  }
}
