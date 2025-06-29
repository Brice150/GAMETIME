import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/user';
import { signs } from 'src/app/shared/data/signs';

@Component({
    selector: 'app-root',
    templateUrl: './calcul.component.html',
    styleUrls: ['./calcul.component.css'],
    standalone: false
})
export class CalculComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  user: User = {} as User;
  difficulty: number = 1;
  equation!: string;
  isActive: boolean[] = [false, false, false, true];
  sign!: string;
  operator!: string;

  constructor() {}

  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    }
    this.medals = this.user.victories.gold[4];

    this.newEquation();
  }

  trigger(signNumber: number) {
    this.isActive.fill(false);
    this.isActive[signNumber] = true;
    this.newEquation();
  }

  changeDifficulty() {
    this.newEquation();
  }

  newEquation() {
    const randomNumber1 = Math.random();
    const maxNumber1 = Math.pow(10, this.difficulty) - 1;
    const randomInteger1 = Math.floor(randomNumber1 * (maxNumber1 + 1));

    const randomNumber2 = Math.random();
    const maxNumber2 = Math.pow(10, this.difficulty) - 1;
    const randomInteger2 = Math.floor(randomNumber2 * (maxNumber2 + 1));

    const signNumber = this.isActive.indexOf(true);

    if (signs[signNumber].sign === '?') {
      const randomOperatorIndex = Math.floor(Math.random() * 3);
      this.sign = signs[randomOperatorIndex].sign;
      this.operator = signs[randomOperatorIndex].operator;
    } else {
      this.sign = signs[signNumber].sign;
      this.operator = signs[signNumber].operator;
    }

    const solution = eval(`randomInteger1 ${this.operator} randomInteger2`);

    if (solution.toString().length <= 5 && solution > 0) {
      this.response = solution.toString();
      this.equation =
        randomInteger1.toString() + this.sign + randomInteger2.toString() + '=';
    } else {
      this.newEquation();
    }
  }

  handleWinEvent() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
      this.user.victories.gold[4] = this.user.victories.gold[4] + 1;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.medals = this.user.victories.gold[4];
    }

    this.newEquation();
  }

  handleLostEvent() {
    this.newEquation();
  }
}
