import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { countries } from 'src/app/shared/data/country/countries';

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
}
