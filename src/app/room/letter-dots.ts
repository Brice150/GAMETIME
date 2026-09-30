import { Player } from '../core/interfaces/player';
import { LetterDot, RoundProgress } from '../core/interfaces/round-progress';

export type { LetterDot } from '../core/interfaces/round-progress';

// Au-dela, une pastille par lettre ne tient plus sur la ligne : le compte
// s'affiche en chiffres.
export const MAX_LETTER_DOTS = 10;

// L'avancee dans la manche en cours, tant qu'elle correspond bien a la
// manche que le joueur est en train de jouer.
export function currentRoundProgress(player: Player): RoundProgress | null {
  const progress = player.currentRoundProgress;

  if (
    player.finishDate ||
    !progress ||
    !progress.lettersTotal ||
    progress.stepIndex !== player.currentRoomWins.length
  ) {
    return null;
  }

  return progress;
}

export function lettersLabel(progress: RoundProgress | null): string | null {
  return progress
    ? `${progress.lettersFound}/${progress.lettersTotal} lettres`
    : null;
}

// Une pastille par lettre du mot, a la place ou le joueur la voit dans sa
// grille : verte si trouvee, rouge si reperee mais mal placee. Une fiche plus
// ancienne, sans positions, groupe les vertes devant.
export function letterDots(progress: RoundProgress | null): LetterDot[] | null {
  if (!progress || progress.lettersTotal > MAX_LETTER_DOTS) {
    return null;
  }

  if (progress.letterDots?.length === progress.lettersTotal) {
    return progress.letterDots;
  }

  const found = progress.lettersFound;
  const misplaced = progress.lettersMisplaced ?? 0;

  return Array.from({ length: progress.lettersTotal }, (unused, index) =>
    index < found ? 'found' : index < found + misplaced ? 'misplaced' : 'empty',
  );
}
