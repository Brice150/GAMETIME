import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { Games } from 'src/app/core/enums/games.enum';
import { WordInputComponent } from 'src/app/shared/components/word-input/word-input.component';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  imports: [CommonModule, MatSliderModule, FormsModule, WordInputComponent],
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css'],
})
export class MotusComponent implements OnInit {
  response!: string;
  wordLength: number = 5;
  games = Games;

  ngOnInit() {
    this.newWord();
  }

  changeWordLength() {
    this.newWord();
  }

  newWord() {
    const wordsFixedLength = words.filter(
      (word) => word.length === this.wordLength
    );
    let randomIndex = Math.floor(Math.random() * wordsFixedLength.length);
    this.response = wordsFixedLength[randomIndex];
  }

  handleWinEvent() {
    //TODO

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
