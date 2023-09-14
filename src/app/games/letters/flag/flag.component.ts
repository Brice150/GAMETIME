import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/user';
import { countries } from 'src/app/shared/data/countries';

@Component({
  selector: 'app-root',
  templateUrl: './flag.component.html',
  styleUrls: ['./flag.component.css'],
})
export class FlagComponent implements OnInit {
  mode!: string;
  response!: string;
  flagApi: string = 'https://flagcdn.com/w160/';
  medals!: number;
  user: User = {} as User;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }
    this.medals = this.user.victories.gold[1];

    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * countries.length);
    this.response = countries[randomIndex].name;
    const timestamp = new Date().getTime();
    this.flagApi = `https://flagcdn.com/w160/${countries[
      randomIndex
    ].code.toLowerCase()}.png?timestamp=${timestamp}`;
  }

  handleWinEvent() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      this.user.victories.gold[1] = this.user.victories.gold[1] + 1;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = this.user.victories.gold[1];
    }

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
