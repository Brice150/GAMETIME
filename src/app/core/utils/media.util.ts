// URL seulement : la balise `<img>` profite du cache HTTP et n'envoie pas
// l'en-tete `Origin` que Brandfetch refuse (protection anti-hotlinking).
const FLAG_API = 'https://flagcdn.com/w160/';
const BRAND_API_START = 'https://cdn.brandfetch.io/';
const BRAND_API_END = '/w/160?c=1idZAj7HGQTm-vegzZa';

export function flagUrl(countryCode: string): string {
  return `${FLAG_API}${countryCode.toLowerCase()}.webp`;
}

export function brandLogoUrl(website: string): string {
  return `${BRAND_API_START}${website}${BRAND_API_END}`;
}
