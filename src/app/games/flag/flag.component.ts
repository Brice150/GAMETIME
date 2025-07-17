import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CountryService } from 'src/app/core/services/country.service';
import { UserService } from 'src/app/core/services/user.service';
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
  userService = inject(UserService);

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
    this.userService.addMedalToGame('flag');

    this.newWord();
  }

  handleLostEvent() {
    this.newWord();
  }
}
