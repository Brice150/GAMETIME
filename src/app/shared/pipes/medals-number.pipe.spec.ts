import { Player } from '../../core/interfaces/player';
import { MedalsNumberPipe } from './medals-number.pipe';
import { TotalMedalsNumberPipe } from './total-medals-number.pipe';

function buildPlayer(medals: Record<string, number>): Player {
  return {
    id: 'p1',
    userId: 'u1',
    username: 'Test',
    animal: '🐱',
    isAdmin: false,
    stats: Object.entries(medals).map(([gameName, medalsNumber]) => ({
      gameName,
      medalsNumber,
      lastSuccessRetrieved: 0,
    })),
    currentRoomWins: [],
    finishDate: null,
    durationMs: null,
    isReady: false,
  };
}

describe('MedalsNumberPipe', () => {
  const pipe = new MedalsNumberPipe();

  it('retourne les medailles du jeu demande', () => {
    const player = buildPlayer({ motus: 7, drapeaux: 3 });

    expect(pipe.transform('motus', player)).toBe(7);
    expect(pipe.transform('drapeaux', player)).toBe(3);
  });

  it('retourne 0 pour un jeu inconnu ou un joueur sans statistiques', () => {
    expect(pipe.transform('marques', buildPlayer({ motus: 7 }))).toBe(0);
    expect(pipe.transform('motus', {} as Player)).toBe(0);
  });
});

describe('TotalMedalsNumberPipe', () => {
  const pipe = new TotalMedalsNumberPipe();

  it('additionne les medailles de tous les jeux', () => {
    expect(
      pipe.transform(buildPlayer({ motus: 7, drapeaux: 3, marques: 1 })),
    ).toBe(11);
  });

  it('retourne 0 sans statistiques', () => {
    expect(pipe.transform(buildPlayer({}))).toBe(0);
  });
});
