import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  http = inject(HttpClient);
  drapeauxApi: string = 'https://flagcdn.com/w160/';

  getDrapeauImage(countryCode: string): Observable<Blob> {
    const url = `${this.drapeauxApi}${countryCode.toLowerCase()}.png`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
