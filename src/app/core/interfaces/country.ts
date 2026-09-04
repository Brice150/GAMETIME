import { Continent } from '../enums/continent.enum';

// Les champs facultatifs alimentent les jeux batis sur les pays. Ils sont
// absents quand la reponse ne tiendrait pas en un seul mot sans accent, ce
// que la saisie n'accepte pas : « Buenos Aires », « Addis-Abeba »,
// « Nuku'alofa ». Le tirage ecarte alors le pays.
export interface Country {
  name: string;
  code: string;
  continent: Continent;
  capital?: string;
}
