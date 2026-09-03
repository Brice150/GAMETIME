import { RoundProgress } from './round-progress';
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
  durationMs: number | null;
  isReady: boolean;
  // Amities : `friendIds` est symetrique (les deux joueurs se possedent
  // mutuellement), `friendRequestIds` ne contient que les demandes recues.
  friendIds?: string[];
  friendRequestIds?: string[];
  currentRoundProgress?: RoundProgress | null;
  vote?: string | null;
}
