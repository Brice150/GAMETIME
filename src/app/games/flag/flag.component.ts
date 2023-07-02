import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Victories } from 'src/app/core/interfaces/victories';
import { countries } from 'src/app/shared/data/countries';

@Component({
  selector: 'app-root',
  templateUrl: './flag.component.html',
  styleUrls: ['./flag.component.css']
})
export class FlagComponent implements OnInit {
  mode!: string;
  victories!: Victories;
  response!: string;
  flagApi: string = "https://flagcdn.com/w160/";
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
    this.medals = [this.victories.gold[1], this.victories.silver[1]];

    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * countries.length);
    this.response = countries[randomIndex].name;
    const timestamp = new Date().getTime();
    this.flagApi = `https://flagcdn.com/w160/${countries[randomIndex].code.toLowerCase()}.png?timestamp=${timestamp}`;
  }

  handleWinEvent(medalsWon: number) {
    let storedValue: string | null = localStorage.getItem('victories');
    if (storedValue !== null) {
      let victories: Victories = JSON.parse(storedValue);
      if (victories.silver[1] + medalsWon < 10) {
        victories.silver[1] = victories.silver[1] + medalsWon;
      }
      else {
        victories.gold[1] = victories.gold[1] + 1;
        victories.silver[1] = victories.silver[1] + medalsWon - 10;
      }
      localStorage.setItem('victories', JSON.stringify(victories));
      this.victories = victories;
      this.medals = [victories.gold[1], victories.silver[1]];
    }
    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
