import { Player } from './player';

export interface Room {
  id: string;
  gameName: string;
  players: Player[];
  userId?: string;
  isStarted: boolean;
  responses: string[];
}
