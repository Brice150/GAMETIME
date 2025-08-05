import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Room } from 'src/app/core/interfaces/room';
import { CountryService } from 'src/app/core/services/country.service';
import { gameMap } from 'src/assets/data/games';
import { WordInputComponent } from './word-input/word-input.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Player } from 'src/app/core/interfaces/player';

@Component({
  selector: 'app-word-games',
  imports: [CommonModule, WordInputComponent, MatProgressSpinnerModule],
  templateUrl: './word-games.component.html',
  styleUrl: './word-games.component.css',
})
export class WordGamesComponent implements OnInit {
  response!: string;
  imageUrl: string = '';
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  toastr = inject(ToastrService);
  countryService = inject(CountryService);
  isOver = false;
  loading = false;
  readonly room = input.required<Room>();
  readonly player = input.required<Player>();
  @Output() finishedStepEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.new();
  }

  handleEvent(stepWon: boolean): void {
    this.finishedStepEvent.emit(stepWon);
  }

  new(): void {
    const index = this.player().currentRoomWins.length;

    if (index === this.room().responses.length) {
      this.isOver = true;
      return;
    }

    if (this.room().gameName === this.drapeauxGameKey) {
      this.loading = true;
      this.countryService
        .getDrapeauImage(this.room().countries[index || 0].code)
        .subscribe({
          next: (blob) => {
            this.imageUrl = URL.createObjectURL(blob);
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
    }

    this.response = this.room().responses[index || 0];
  }
}
