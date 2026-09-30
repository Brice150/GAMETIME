import { RoundProgress } from './round-progress';
import { Stat } from './stat';

// Comment le joueur est entre dans sa room : l'hote la cree, les autres
// tapent le code, suivent un lien, acceptent une invitation ou rejoignent un
// ami.
export type JoinChannel = 'code' | 'link' | 'invitation' | 'friend';

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
  // Laisser ses amis voir qu'on est dans une salle. Absent vaut actif : les
  // fiches creees avant ce reglage restent visibles.
  shareActivity?: boolean;
  joinedVia?: JoinChannel | null;
}
