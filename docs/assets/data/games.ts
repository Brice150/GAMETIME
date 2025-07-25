import { Game } from 'src/app/core/interfaces/game';

export const games: Game[] = [
  {
    key: 'motus',
    label: 'Motus',
    icon: 'bx bxs-objects-horizontal-left',
  },
  {
    key: 'drapeaux',
    label: 'Drapeaux',
    icon: 'bx bxs-flag',
  },
];

export const gameMap = Object.fromEntries(
  games.map((game) => [game.key, game])
);
