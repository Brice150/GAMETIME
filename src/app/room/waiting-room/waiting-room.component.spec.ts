import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { WaitingRoomComponent } from './waiting-room.component';

describe('WaitingRoomComponent', () => {
  async function build(
    players = [buildPlayer()],
  ): Promise<ComponentFixture<WaitingRoomComponent>> {
    await TestBed.configureTestingModule({
      imports: [WaitingRoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WaitingRoomComponent);
    fixture.componentRef.setInput('room', buildRoom({ userId: 'u1' }));
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();

    return fixture;
  }

  beforeEach(() => {
    // jsdom ne fournit pas de presse-papiers.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('propose le vote des qu un autre joueur est la', async () => {
    const fixture = await build([
      buildPlayer(),
      buildPlayer({ id: 'p2', userId: 'u2' }),
    ]);

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-vote-panel')).toBeTruthy();
  });

  it('masque le vote tant que l hote est seul', async () => {
    const fixture = await build();

    expect(fixture.nativeElement.querySelector('app-vote-panel')).toBeNull();
  });

  it('copie le code de la partie', async () => {
    const component = (await build()).componentInstance;
    const info = vi.spyOn(component.toastrHelper, 'info');

    component.copyCode();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD');
    expect(info).toHaveBeenCalledWith('Code de la partie copié', 'Code');
  });

  it('remonte le vote et l exclusion a la page room', async () => {
    const component = (await build()).componentInstance;
    const voted = vi.fn();
    const deleted = vi.fn();
    component.voteEvent.subscribe(voted);
    component.deleteEvent.subscribe(deleted);
    const other = buildPlayer({ id: 'p2', userId: 'u2' });

    component.vote('motus');
    component.delete(other);

    expect(voted).toHaveBeenCalledWith('motus');
    expect(deleted).toHaveBeenCalledWith(other);
  });
});
