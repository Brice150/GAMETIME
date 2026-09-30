export interface RoundProgress {
  stepIndex: number;
  lettersFound: number;
  // Lettres du mot reperees mais pas encore a leur place.
  lettersMisplaced?: number;
  lettersTotal: number;
}
