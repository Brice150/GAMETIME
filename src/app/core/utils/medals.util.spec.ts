import { Player } from '../interfaces/player';
import { getTotalMedalsNumber } from './medals.util';

function buildPlayer(stats: Player['stats']): Player {
  return {
    id: 'p1',
    userId: 'u1',
    username: 'Test',
    animal: '🐱',
    isAdmin: false,
    stats,
    currentRoomWins: [],
    finishDate: null,
    durationMs: null,
    isReady: false,
  };
}

describe('getTotalMedalsNumber', () => {
  it('additionne les medailles des jeux actifs', () => {
    const player = buildPlayer([
      { gameName: 'motus', medalsNumber: 7, lastSuccessRetrieved: 0 },
      { gameName: 'drapeaux', medalsNumber: 3, lastSuccessRetrieved: 0 },
      { gameName: 'marques', medalsNumber: 1, lastSuccessRetrieved: 0 },
    ]);

    expect(getTotalMedalsNumber(player)).toBe(11);
  });

  it('ignore les jeux retires de l application', () => {
    const player = buildPlayer([
      { gameName: 'motus', medalsNumber: 4, lastSuccessRetrieved: 0 },
      { gameName: 'jeu-supprime', medalsNumber: 99, lastSuccessRetrieved: 0 },
    ]);

    expect(getTotalMedalsNumber(player)).toBe(4);
  });

  it('retourne 0 sans joueur ou sans statistiques', () => {
    expect(getTotalMedalsNumber(undefined)).toBe(0);
    expect(getTotalMedalsNumber(buildPlayer([]))).toBe(0);
  });
});
