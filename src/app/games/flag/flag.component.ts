import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Games } from 'src/app/core/enums/games.enum';
import { CountryService } from 'src/app/core/services/country.service';
import { WordInputComponent } from 'src/app/shared/components/word-input/word-input.component';
import { countries } from 'src/app/shared/data/countries';

@Component({
  selector: 'app-root',
  imports: [CommonModule, WordInputComponent],
  templateUrl: './flag.component.html',
  styleUrls: ['./flag.component.css'],
})
export class FlagComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  imageUrl: string = '';
  countryService = inject(CountryService);
  games = Games;

  ngOnInit() {
    this.newWord();
  }

  newWord() {
    const randomIndex = Math.floor(Math.random() * countries.length);
    const country = countries[randomIndex];
    this.response = country.name;
    this.imageUrl = this.countryService.getFlagImageUrl(country.code);
  }

  handleWinEvent() {
    //TODO

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
