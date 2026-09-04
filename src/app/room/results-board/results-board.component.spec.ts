import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { ResultsBoardComponent } from './results-board.component';

function buildPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'p',
    userId: 'u',
    username: 'Test',
    animal: '🐱',
    isAdmin: false,
    stats: [],
    currentRoomWins: [],
    finishDate: null,
    durationMs: null,
    isReady: false,
    ...overrides,
  };
}

function buildRoom(startedPlayerIds: string[]): Room {
  return {
    id: 'room-1',
    userId: 'host',
    responses: ['CHAT', 'CHIEN'],
    startedPlayerIds,
  } as unknown as Room;
}

describe('ResultsBoardComponent', () => {
  let fixture: ComponentFixture<ResultsBoardComponent>;
  let component: ResultsBoardComponent;

  function build(room: Room, players: Player[], currentPlayerId = 'host') {
    fixture = TestBed.createComponent(ResultsBoardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('room', room);
    fixture.componentRef.setInput('players', players);
    fixture.componentRef.setInput('currentPlayerId', currentPlayerId);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsBoardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('marque spectateur un joueur arrive apres la fin de la partie', () => {
    const latecomer = buildPlayer({
      id: 'p2',
      userId: 'late',
      finishDate: new Date(),
      currentRoomWins: [],
    });

    build(buildRoom(['host']), [
      buildPlayer({ id: 'p1', userId: 'host', currentRoomWins: [true, true] }),
      latecomer,
    ]);

    expect(component.isSpectator(latecomer)).toBe(true);
  });

  it('ne marque pas spectateur un joueur arrive en cours de partie', () => {
    const latecomer = buildPlayer({
      id: 'p2',
      userId: 'late',
      finishDate: null,
      currentRoomWins: [],
    });

    build(buildRoom(['host']), [
      buildPlayer({ id: 'p1', userId: 'host', currentRoomWins: [true] }),
      latecomer,
    ]);

    expect(component.isSpectator(latecomer)).toBe(false);
  });

  it('ne marque personne spectateur sur une room sans participants enregistres', () => {
    const player = buildPlayer({ userId: 'late', finishDate: new Date() });

    build(buildRoom([]), [player]);

    expect(component.isSpectator(player)).toBe(false);
  });

  it('numerote le classement dans l ordre recu', () => {
    build(buildRoom(['host', 'other']), [
      buildPlayer({ id: 'p1', userId: 'host', currentRoomWins: [true, true] }),
      buildPlayer({
        id: 'p2',
        userId: 'other',
        currentRoomWins: [true, false],
      }),
    ]);

    expect(component.standings().map((entry) => entry.rank)).toEqual([1, 2]);
    expect(component.standings().map((entry) => entry.wins)).toEqual([2, 1]);
  });
});
