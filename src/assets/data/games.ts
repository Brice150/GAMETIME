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

// Choix de configuration, pas un jeu : resolu en jeu reel au lancement.
export const randomGameKey = 'aleatoire';

export const randomGame: KeyLabel = {
  key: randomGameKey,
  label: 'Aléatoire',
  icon: 'bx bx-shuffle',
};

export const selectableGames: KeyLabel[] = [...games, randomGame];

export const restartVoteKey = 'recommencer';

export const voteOptions: KeyLabel[] = [
  { key: restartVoteKey, label: 'Recommencer', icon: 'bx bx-revision' },
  ...games,
  { key: randomGameKey, label: 'Peu importe', icon: 'bx bx-shuffle' },
];

export const voteMap = Object.fromEntries(
  voteOptions.map((option) => [option.key, option]),
);

// Dans la salle d'attente il n'y a encore rien a recommencer.
export const firstGameVoteOptions: KeyLabel[] = voteOptions.filter(
  (option) => option.key !== restartVoteKey,
);

export function pickRandomGameKey(): string {
  return games[Math.floor(Math.random() * games.length)].key;
}

export function resolveGameKey(gameKey: string): string {
  return gameKey === randomGameKey ? pickRandomGameKey() : gameKey;
}
