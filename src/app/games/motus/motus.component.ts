import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/user';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css']
})
export class MotusComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number[];
  user: User = {} as User;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }  
    this.medals = [this.user.victories.gold[0], this.user.victories.silver[0]];

    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * words.length);
    this.response = words[randomIndex];
  }

  handleWinEvent(medalsWon: number) {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      if (this.user.victories.silver[0] + medalsWon < 10) {
        this.user.victories.silver[0] = this.user.victories.silver[0] + medalsWon;
      }
      else {
        this.user.victories.gold[0] = this.user.victories.gold[0] + 1;
        this.user.victories.silver[0] = this.user.victories.silver[0] + medalsWon - 10;
      }
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = [this.user.victories.gold[0], this.user.victories.silver[0]];
    }
    
    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}