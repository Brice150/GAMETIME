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
  categoryFilter: number;
  isWordLengthIncreasing: boolean;
  startWordLength: number;
  responses: string[];
  countries: Country[];
  brands: Brand[];
  startDate: Date | null;
  startAgainNumber: number;
  roomCode: string;
  // Participants au moment du lancement : sert a reconnaitre un joueur
  // arrive en cours de partie.
  startedPlayerIds?: string[];
  // Horodatages de service : reperer les rooms abandonnees, qu'aucun
  // « Quitter » n'a supprimees.
  createdAt?: Date;
  lastActivityAt?: Date;
  isLoading?: boolean;
}
