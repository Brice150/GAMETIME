import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import {
  MotionRaceComponent,
  RACE_EVENTS,
  SECONDS_PER_EVENT,
} from './motion-race.component';

describe('MotionRaceComponent', () => {
  let fixture: ComponentFixture<MotionRaceComponent>;
  let component: MotionRaceComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionRaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('part d une manche vierge', () => {
    component.reset();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(component.clock()).toBe('0:00');
    expect(component.positions()).toEqual([0, 1, 2]);
    expect(element.querySelectorAll('.dot.is-on')).toHaveLength(0);
    expect(element.querySelector('.flash')).toBeNull();
  });

  it('fait passer devant celui qui trouve une lettre', () => {
    component.score(1, 1);

    expect(component.positions()).toEqual([1, 0, 2]);
  });

  it('laisse devant le premier arrive a egalite', () => {
    component.score(1, 1);
    component.score(0, 2);

    expect(component.positions()).toEqual([1, 0, 2]);
  });

  it('joue la manche jusqu au podium', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(component.positions()).toEqual([0, 1, 2]);
    expect(component.finishers()).toEqual([0, 1]);
    expect(component.trophy(0)).toBe('gold');
    expect(component.trophy(1)).toBe('silver');
    expect(component.trophy(2)).toBeNull();
    expect(component.clock()).toBe(
      `0:${RACE_EVENTS.length * SECONDS_PER_EVENT}`,
    );
    expect(element.querySelectorAll('.bxs-trophy')).toHaveLength(2);
    expect(element.querySelector('.flash')?.textContent).toContain('0:33');
  });
});
