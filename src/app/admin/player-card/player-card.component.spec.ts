import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appTestProviders, buildPlayer } from '../../../testing/test-providers';
import { Player } from '../../core/interfaces/player';
import { PlayerCardComponent } from './player-card.component';

describe('PlayerCardComponent', () => {
  async function build(
    player: Player = buildPlayer(),
  ): Promise<ComponentFixture<PlayerCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [PlayerCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(PlayerCardComponent);
    fixture.componentRef.setInput('player', player);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect((await build()).componentInstance).toBeTruthy();
  });

  it('compte les amis, y compris quand la fiche n en porte pas', async () => {
    expect(
      (await build(buildPlayer({ friendIds: ['u2', 'u3'] }))).componentInstance
        .friendsNumber,
    ).toBe(2);

    TestBed.resetTestingModule();

    expect(
      (await build(buildPlayer({ friendIds: undefined }))).componentInstance
        .friendsNumber,
    ).toBe(0);
  });

  it('remonte la fiche a modifier', async () => {
    const player = buildPlayer();
    const component = (await build(player)).componentInstance;
    const updated = vi.fn();
    component.updateEvent.subscribe(updated);

    component.update();

    expect(updated).toHaveBeenCalledWith(player);
  });
});
