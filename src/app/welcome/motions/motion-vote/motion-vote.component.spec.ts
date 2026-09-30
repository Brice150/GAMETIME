import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import { ANY_GAME, MotionVoteComponent } from './motion-vote.component';

describe('MotionVoteComponent', () => {
  let fixture: ComponentFixture<MotionVoteComponent>;
  let component: MotionVoteComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionVoteComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('part sans aucune voix', () => {
    component.reset();
    fixture.detectChanges();

    expect(component.leader()).toBeNull();
    expect(component.leaderLabel()).toBeUndefined();
    expect(element.querySelectorAll('.count')).toHaveLength(0);
    expect(element.querySelector('.tally')?.textContent).toContain('0 / 4');
  });

  it('garde en tete le premier jeu arrive a egalite', () => {
    component.cast.set([
      [1, 'capitals'],
      [2, 'flags'],
    ]);

    expect(component.leader()).toBe('capitals');
  });

  it('ne donne jamais la tete a « peu importe »', () => {
    component.cast.set([[3, ANY_GAME]]);

    expect(component.leader()).toBeNull();
    expect(component.counts()[ANY_GAME]).toBe(1);
  });

  it('compte les voix et ouvre le lancement sur le jeu majoritaire', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();

    expect(component.counts()['capitals']).toBe(2);
    expect(component.hasVoted(0)).toBe(true);
    expect(element.querySelectorAll('.voter.has-voted')).toHaveLength(4);
    expect(element.querySelector('.game.is-winner')?.textContent).toContain(
      'Capitales',
    );
    expect(element.querySelector('.launch')?.textContent).toContain(
      'Capitales',
    );
    expect(element.querySelector('.tally')).toBeNull();
  });
});
