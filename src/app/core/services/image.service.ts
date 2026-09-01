import { Injectable } from '@angular/core';

// URL seulement : la balise `<img>` profite du cache HTTP et n'envoie pas
// l'en-tete `Origin` que Brandfetch refuse (protection anti-hotlinking).
@Injectable({
  providedIn: 'root',
})
export class ImageService {
  drapeauxApi = 'https://flagcdn.com/w160/';
  marquesApiStart = 'https://cdn.brandfetch.io/';
  marquesApiEnd = '/w/160?c=1idZAj7HGQTm-vegzZa';

  getDrapeauImageUrl(countryCode: string): string {
    return `${this.drapeauxApi}${countryCode.toLowerCase()}.webp`;
  }

  getLogoMarqueUrl(website: string): string {
    return `${this.marquesApiStart}${website}${this.marquesApiEnd}`;
  }
}
