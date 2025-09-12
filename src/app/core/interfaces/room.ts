import { Brand } from './brand';
import { Country } from './country';
import { Question } from './question';

export interface Room {
  id?: string;
  gameName: string;
  playerIds: string[];
  userId?: string;
  isStarted: boolean;
  showFirstLetter: boolean;
  stepsNumber: number;
  difficultyFilter: number;
  categoryFilter: number;
  isWordLengthIncreasing: boolean;
  startWordLength: number;
  responses: string[];
  countries: Country[];
  brands: Brand[];
  questions: Question[];
  startDate: Date | null;
  startAgainNumber: number;
  isCreatedByAdmin: boolean;
  isReadyNotificationActivated: boolean;
  roomCode: string;
  isLoading?: boolean;
}
