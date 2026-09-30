// Etat d'une case du mot, tel que le joueur le voit dans sa grille.
export type LetterDot = 'found' | 'misplaced' | 'empty';

export interface RoundProgress {
  stepIndex: number;
  lettersFound: number;
  // Lettres du mot reperees mais pas encore a leur place.
  lettersMisplaced?: number;
  lettersTotal: number;
  // Une case par lettre, a la place ou le joueur l'a dans sa grille : les
  // autres voient quelle lettre il tient. Absent des fiches plus anciennes.
  letterDots?: LetterDot[];
}
