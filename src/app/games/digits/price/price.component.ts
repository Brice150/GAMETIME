import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/user';

@Component({
  selector: 'app-root',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.css'],
})
export class PriceComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  user: User = {} as User;
  numberLength: number = 3;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }
    this.medals = this.user.victories.gold[3];

    this.newNumber();
  }

  changeNumberLength() {
    this.newNumber();
  }

  newNumber() {
    const randomNumber = Math.random();
    const maxNumber = Math.pow(10, this.numberLength) - 1;
    let randomInteger = Math.floor(randomNumber * (maxNumber + 1));
    randomInteger -= randomInteger % 5;
    const randomIntegerStr = randomInteger.toString();
    if (randomIntegerStr.length === this.numberLength) {
      this.response = randomIntegerStr;
    } else {
      this.newNumber();
    }
  }

  handleWinEvent() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      this.user.victories.gold[3] = this.user.victories.gold[3] + 1;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = this.user.victories.gold[3];
    }

    this.newNumber();
  }

  handleLostEvent() {
    this.newNumber();
  }
}
