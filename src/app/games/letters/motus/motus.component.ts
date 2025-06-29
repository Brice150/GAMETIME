import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { User } from 'src/app/core/interfaces/user';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { WordInputComponent } from 'src/app/shared/components/word-input/word-input.component';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatSliderModule,
    FormsModule,
    HeaderComponent,
    WordInputComponent,
  ],
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css'],
})
export class MotusComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  user: User = {} as User;
  wordLength: number = 5;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }
    this.medals = this.user.victories.gold[0];

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
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      this.user.victories.gold[0] = this.user.victories.gold[0] + 1;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = this.user.victories.gold[0];
    }

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
