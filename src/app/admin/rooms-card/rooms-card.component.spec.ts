import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { RoomsCardComponent } from './rooms-card.component';

describe('RoomsCardComponent', () => {
  async function build(
    rooms: Room[] = [buildRoom()],
    playersByRoom: Record<string, Player[]> = { r1: [buildPlayer()] },
  ): Promise<ComponentFixture<RoomsCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [RoomsCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(RoomsCardComponent);
    fixture.componentRef.setInput('rooms', rooms);
    fixture.componentRef.setInput('playersByRoom', playersByRoom);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect((await build()).componentInstance).toBeTruthy();
  });

  it('liste les joueurs d une room, et rien pour une room vide', async () => {
    const component = (await build()).componentInstance;

    expect(component.roomPlayers(buildRoom())).toHaveLength(1);
    expect(component.roomPlayers(buildRoom({ id: 'r2' }))).toEqual([]);
  });

  it('reconnait l hote de la room', async () => {
    const component = (await build()).componentInstance;
    const room = buildRoom({ userId: 'u1' });

    expect(component.isHost(room, buildPlayer({ userId: 'u1' }))).toBe(true);
    expect(component.isHost(room, buildPlayer({ userId: 'u2' }))).toBe(false);
    expect(component.isHost(room, buildPlayer({ userId: undefined }))).toBe(
      false,
    );
  });

  describe('etat de la room', () => {
    it('annonce une room en attente', async () => {
      const component = (await build()).componentInstance;
      const room = buildRoom({ isStarted: false });

      expect(component.stateLabel(room)).toBe('En attente');
      expect(component.stateIcon(room)).toBe('bx bxs-time-five');
    });

    it('annonce le jeu d une partie lancee', async () => {
      const component = (await build()).componentInstance;
      const room = buildRoom({ isStarted: true, gameName: 'drapeaux' });

      expect(component.stateLabel(room)).toBe('Drapeaux');
      expect(component.stateIcon(room)).toBe('bx bxs-flag');
    });

    it('reste lisible sur un jeu inconnu', async () => {
      const component = (await build()).componentInstance;
      const room = buildRoom({ isStarted: true, gameName: 'echecs' });

      expect(component.stateLabel(room)).toBe('echecs');
      expect(component.stateIcon(room)).toBe('bx bxs-error-alt');
    });
  });

  it('remonte l entree et la suppression a la page admin', async () => {
    const component = (await build()).componentInstance;
    const joined = vi.fn();
    const deleted = vi.fn();
    component.joinEvent.subscribe(joined);
    component.deleteEvent.subscribe(deleted);

    component.join('r1');
    component.delete('r1');

    expect(joined).toHaveBeenCalledWith('r1');
    expect(deleted).toHaveBeenCalledWith('r1');
  });
});
