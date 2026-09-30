import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import {
  ME,
  MotionRankingComponent,
  START_MEDALS,
  WINS,
} from './motion-ranking.component';

describe('MotionRankingComponent', () => {
  let fixture: ComponentFixture<MotionRankingComponent>;
  let component: MotionRankingComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionRankingComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('part de la troisieme place', () => {
    component.reset();
    fixture.detectChanges();

    expect(component.rank()).toBe(3);
    expect(component.trophy(ME)).toBe('bronze');
    expect(component.trophy(3)).toBeNull();
    expect(element.querySelector('.standing')?.textContent).toContain('3e');
    expect(element.querySelector('.achievement')).toBeNull();
  });

  it('laisse sa place au rival a egalite', () => {
    component.medals.set(1990);

    expect(component.rank()).toBe(3);
  });

  it('affiche la derniere manche gagnee sur la ligne du joueur', () => {
    component.win.set({ id: 0, ...WINS[0] });
    fixture.detectChanges();

    expect(element.querySelector('.row.is-me .gain')?.textContent).toContain(
      '+5 · Capitales',
    );
  });

  it('remonte en tete et debloque le succes', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();

    const gained = WINS.reduce((sum, win) => sum + win.medals, 0);
    expect(component.medals()).toBe(START_MEDALS + gained);
    expect(component.rank()).toBe(1);
    expect(component.trophy(ME)).toBe('gold');
    expect(element.querySelector('.standing')?.textContent).toContain('1er');
    expect(element.querySelector('.achievement')?.textContent).toContain(
      'Succès débloqué',
    );
  });
});
