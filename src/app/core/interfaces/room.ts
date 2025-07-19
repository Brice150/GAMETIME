import { Country } from './country';
import { PlayerRoom } from './player-room';

export interface Room {
  id?: string;
  gameName: string;
  playersRoom: PlayerRoom[];
  userId?: string;
  isStarted: boolean;
  isSolo: boolean;
  showFirstLetter: boolean;
  responses: string[];
  countries: Country[];
}
