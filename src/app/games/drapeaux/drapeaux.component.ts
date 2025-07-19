import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CountryService } from 'src/app/core/services/country.service';
import { WordInputComponent } from 'src/app/shared/components/word-input/word-input.component';
import { countries } from 'src/app/shared/data/countries';
import { gameMap } from 'src/assets/data/games';

@Component({
  selector: 'app-drapeaux',
  imports: [CommonModule, WordInputComponent],
  templateUrl: './drapeaux.component.html',
  styleUrls: ['./drapeaux.component.css'],
})
export class DrapeauxComponent implements OnInit {
  mode!: string;
  response!: string;
  medals!: number;
  imageUrl: string = '';
  countryService = inject(CountryService);
  drapeauxGameKey = gameMap['drapeaux'].key;

  ngOnInit() {
    this.newWord();
  }

  newWord() {
    const randomIndex = Math.floor(Math.random() * countries.length);
    const country = countries[randomIndex];
    this.response = country.name;
    this.imageUrl = this.countryService.getDrapeauImageUrl(country.code);
  }

  handleWinEvent() {
    //TODO

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
