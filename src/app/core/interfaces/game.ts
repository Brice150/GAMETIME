import { KeyLabel } from './key-label';

// Une manche : le mot a trouver, l'enonce qui l'introduit et son illustration.
// Les deux derniers sont vides pour un jeu qui se joue sans indice, comme
// Motus.
export interface GameRound {
  response: string;
  prompt: string;
  media: string;
}

export interface GameDrawOptions {
  stepsNumber: number;
  categoryFilter: number;
  isWordLengthIncreasing: boolean;
  startWordLength: number;
}

/**
 * Tout ce que l'application a besoin de savoir d'un jeu. Ces descripteurs
 * remplacent les chaines de `if (gameName === ...)` qui couraient dans la
 * page room, la fenetre de configuration et le service de room : ajouter un
 * jeu ne demande plus que d'ecrire une entree ici et son jeu de donnees.
 */
export interface GameDefinition extends KeyLabel {
  // Rattachement a une categorie de `gameCategories`.
  categoryKey: string;
  // Libelles du filtre de categorie, le premier valant « tout ». Absent :
  // le jeu ne propose pas de filtre.
  filterLabels?: string[];
  // Motus seul : la longueur du mot se regle et peut croitre d'une manche a
  // l'autre.
  hasWordLength?: boolean;
  // Etat par defaut de « Afficher la 1ere lettre » pour ce jeu.
  showFirstLetter?: boolean;
  // Charge le jeu de donnees sans rien tirer : sert au prechargement pendant
  // que les joueurs attendent dans la salle.
  load: () => Promise<unknown>;
  draw: (options: GameDrawOptions) => Promise<GameRound[]>;
}
