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
  stepsNumber: number;
  continentFilter: number;
  isWordLengthIncreasing: boolean;
  startWordLength: number;
  responses: string[];
  countries: Country[];
  startDate: Date | null;
  startAgainNumber: number;
  isCreatedByAdmin: boolean;
}
