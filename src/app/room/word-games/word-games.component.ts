import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PlayerRoom } from 'src/app/core/interfaces/player-room';
import { Room } from 'src/app/core/interfaces/room';
import { CountryService } from 'src/app/core/services/country.service';
import { gameMap } from 'src/assets/data/games';
import { WordInputComponent } from './word-input/word-input.component';

@Component({
  selector: 'app-word-games',
  imports: [CommonModule, WordInputComponent],
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
  readonly room = input.required<Room>();
  readonly playerRoom = input.required<PlayerRoom>();
  @Output() finishedStepEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.new();
  }

  handleEvent(stepWon: boolean): void {
    this.finishedStepEvent.emit(stepWon);
  }

  new(): void {
    const index = this.playerRoom().currentRoomWins.length;

    if (index === this.room().responses.length) {
      this.isOver = true;
      return;
    }

    if (this.room().gameName === this.drapeauxGameKey) {
      this.imageUrl = this.countryService.getDrapeauImageUrl(
        this.room().countries[index || 0].code
      );
    }

    this.response = this.room().responses[index || 0];
  }
}
