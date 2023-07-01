import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { countries } from 'src/app/shared/data/countries';

@Component({
  selector: 'app-root',
  templateUrl: './flag.component.html',
  styleUrls: ['./flag.component.css']
})
export class FlagComponent implements OnInit {
  mode!: string;
  victory: number = 0;
  response!: string;

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'];
    });

    let storedValue = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      this.victory = JSON.parse(storedValue)[1];
    }

    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * countries.length);
    this.response = countries[randomIndex].name;
  }

  handleWinEvent() {
    let storedValue: string | null = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      let victories: number[] = JSON.parse(storedValue);
      victories[1] = victories[1] + 1;
      localStorage.setItem('victoryNumber', JSON.stringify(victories));
      this.victory = victories[1];
    }
    this.newWord();
  }
}
