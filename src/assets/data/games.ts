import { Game } from 'src/app/core/interfaces/game';

export const games: Game[] = [
  {
    key: 'drapeaux',
    label: 'Drapeaux',
    icon: 'bx bxs-flag',
  },
  {
    key: 'marques',
    label: 'Marques',
    icon: 'bx bxs-package',
  },
  {
    key: 'motus',
    label: 'Motus',
    icon: 'bx bxs-objects-horizontal-left',
  },
  {
    key: 'quiz',
    label: 'Quiz',
    icon: 'bx bxs-help-circle',
  },
];

export const gameMap = Object.fromEntries(
  games.map((game) => [game.key, game])
);
