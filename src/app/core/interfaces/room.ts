import { Brand } from './brand';
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
  categoryFilter: number;
  isWordLengthIncreasing: boolean;
  startWordLength: number;
  responses: string[];
  countries: Country[];
  brands: Brand[];
  startDate: Date | null;
  startAgainNumber: number;
  isCreatedByAdmin: boolean;
  isReadyNotificationActivated: boolean;
  roomCode: string;
}
