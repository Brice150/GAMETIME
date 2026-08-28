import { KeyLabel } from '../../app/core/interfaces/key-label';

export const games: KeyLabel[] = [
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
];

export const gameMap = Object.fromEntries(
  games.map((game) => [game.key, game]),
);
