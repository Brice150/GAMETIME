import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import {
  MotionGridComponent,
  PUZZLES,
  scoreGuess,
} from './motion-grid.component';

describe('scoreGuess', () => {
  it('distingue bien place, mal place et absent', () => {
    expect(scoreGuess('SOUPE', 'SUCRE')).toEqual([
      'wellPlaced',
      'absent',
      'wrongPlaced',
      'absent',
      'wellPlaced',
    ]);
  });

  it('ne signale pas deux fois une lettre presente une seule fois', () => {
    expect(scoreGuess('EELLE', 'HELLO')).toEqual([
      'absent',
      'wellPlaced',
      'wellPlaced',
      'wellPlaced',
      'absent',
    ]);
  });
});

describe('MotionGridComponent', () => {
  let fixture: ComponentFixture<MotionGridComponent>;
  let component: MotionGridComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionGridComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('offre la premiere lettre du mot', () => {
    component.reset();
    fixture.detectChanges();

    expect(component.input()).toEqual(['S', '', '', '', '']);
    expect(element.querySelectorAll('.letter.is-empty')).toHaveLength(4);
    expect(element.querySelector('.clue')?.textContent).toContain('Motus');
  });

  it('joue les essais jusqu au mot trouve', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();

    const [last] = component.attempts();
    expect(last.word).toBe('SUCRE');
    expect(last.revealed).toBe(5);
    expect(component.attempts()).toHaveLength(PUZZLES[0].guesses.length);
    expect(element.querySelector('.line.is-solved')?.textContent).toContain(
      'S',
    );
    expect(element.querySelectorAll('.is-solved .wellPlaced')).toHaveLength(5);
    expect(element.querySelector('.wrongPlaced')).toBeTruthy();
  });

  it('passe au jeu suivant a chaque tour, puis reboucle', () => {
    const games = PUZZLES.map(() => {
      component.reset();
      return component.puzzle().game;
    });
    component.reset();

    expect(games).toEqual(PUZZLES.map((puzzle) => puzzle.game));
    expect(component.puzzle().game).toBe(PUZZLES[0].game);
    expect(component.solved()).toBe(false);
  });
});
