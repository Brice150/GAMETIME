import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Victories } from 'src/app/core/interfaces/victories';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css']
})
export class MotusComponent implements OnInit {
  mode!: string;
  victories!: Victories;
  response!: string;
  medals!: number[];

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'];
    });

    let storedValue: string | null = localStorage.getItem('victories');
    if (storedValue !== null) {
      this.victories = JSON.parse(storedValue);
    }
    this.medals = [this.victories.gold[0], this.victories.silver[0]];

    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * words.length);
    this.response = words[randomIndex];
  }

  handleWinEvent(medalsWon: number) {
    let storedValue: string | null = localStorage.getItem('victories');
    if (storedValue !== null) {
      let victories: Victories = JSON.parse(storedValue);
      if (victories.silver[0] + medalsWon < 10) {
        victories.silver[0] = victories.silver[0] + medalsWon;
      }
      else {
        victories.gold[0] = victories.gold[0] + 1;
        victories.silver[0] = victories.silver[0] + medalsWon - 10;
      }
      localStorage.setItem('victories', JSON.stringify(victories));
      this.victories = victories;
      this.medals = [victories.gold[0], victories.silver[0]];
    }
    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}