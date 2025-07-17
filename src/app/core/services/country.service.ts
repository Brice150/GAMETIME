import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  flagApi: string = 'https://flagcdn.com/w160/';

  getFlagImageUrl(countryCode: string): string {
    const timestamp = new Date().getTime();
    return `${
      this.flagApi
    }${countryCode.toLowerCase()}.png?timestamp=${timestamp}`;
  }
}
