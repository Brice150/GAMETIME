import { Country } from './country';

export interface Room {
  id?: string;
  gameName: string;
  playerIds: string[];
  userId?: string;
  isStarted: boolean;
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
  isReadyNotificationActivated: boolean;
}
