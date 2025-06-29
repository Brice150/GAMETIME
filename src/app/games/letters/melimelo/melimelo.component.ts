import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/user';
import { words } from 'src/app/shared/data/words';

@Component({
    selector: 'app-root',
    templateUrl: './melimelo.component.html',
    styleUrls: ['./melimelo.component.css'],
    standalone: false
})
export class MeliMeloComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  user: User = {} as User;
  wordLength: number = 5;
  mixedWord!: string;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }
    this.medals = this.user.victories.gold[2];

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
    this.mixLetters();
  }

  mixLetters() {
    const letters = this.response.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    this.mixedWord = letters.join('');
  }

  handleWinEvent() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      this.user.victories.gold[2] = this.user.victories.gold[2] + 1;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = this.user.victories.gold[2];
    }

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
