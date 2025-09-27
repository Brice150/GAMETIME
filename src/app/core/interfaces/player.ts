import { Stat } from './stat';

export interface Player {
  id: string;
  userId?: string;
  username: string;
  animal: string;
  isAdmin: boolean;
  stats: Stat[];
  currentRoomWins: boolean[];
  finishDate: Date | null;
  isReady: boolean;
}
