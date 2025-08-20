import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  http = inject(HttpClient);
  drapeauxApi: string = 'https://flagcdn.com/w160/';
  marquesApiStart: string = 'https://cdn.brandfetch.io/';
  marquesApiEnd: string = '/w/160?c=1idZAj7HGQTm-vegzZa';

  getDrapeauImage(countryCode: string): Observable<Blob> {
    const url = `${this.drapeauxApi}${countryCode.toLowerCase()}.webp`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getLogoMarque(website: string): Observable<Blob> {
    const url = `${this.marquesApiStart}${website}${this.marquesApiEnd}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
