import { Continent } from '../enums/continent.enum';

export interface Country {
  name: string;
  code: string;
  continent: Continent;
}
