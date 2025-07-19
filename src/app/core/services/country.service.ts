import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  drapeauxApi: string = 'https://flagcdn.com/w160/';

  getDrapeauImageUrl(countryCode: string): string {
    const timestamp = new Date().getTime();
    return `${
      this.drapeauxApi
    }${countryCode.toLowerCase()}.png?timestamp=${timestamp}`;
  }
}
