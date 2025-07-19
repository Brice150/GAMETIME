import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WordInputComponent } from 'src/app/shared/components/word-input/word-input.component';
import { gameMap } from 'src/assets/data/games';

@Component({
  selector: 'app-motus',
  imports: [CommonModule, WordInputComponent],
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css'],
})
export class MotusComponent implements OnInit {
  response!: string;
  motusGameKey = gameMap['motus'].key;

  ngOnInit(): void {
    this.newWord();
  }

  newWord(): void {
    /*
    const wordsFixedLength = words.filter(
      (word) => word.length === this.wordLength
    );
    let randomIndex = Math.floor(Math.random() * wordsFixedLength.length);
    this.response = wordsFixedLength[randomIndex];
    */
  }

  handleWinEvent(): void {
    //TODO

    this.newWord();
  }

  handleLostEvent(): void {
    this.newWord();
  }
}
