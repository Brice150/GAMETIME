import { ElementFamily } from '../enums/element-family.enum';

// `symbol` sert d'enonce, `name` de reponse a taper.
export interface ChemicalElement {
  symbol: string;
  name: string;
  family: ElementFamily;
}
