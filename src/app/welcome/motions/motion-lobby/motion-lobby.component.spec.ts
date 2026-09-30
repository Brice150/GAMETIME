import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import {
  GUESTS,
  MotionLobbyComponent,
  ROOM_CODE,
} from './motion-lobby.component';

describe('MotionLobbyComponent', () => {
  let fixture: ComponentFixture<MotionLobbyComponent>;
  let component: MotionLobbyComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionLobbyComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('part d un salon vide, avec l hote seul', () => {
    component.reset();
    fixture.detectChanges();

    expect(element.querySelectorAll('.char.is-typed')).toHaveLength(0);
    expect(element.querySelectorAll('.player:not(.waiting)')).toHaveLength(1);
    expect(element.querySelector('.via')).toBeNull();
  });

  it('signale la copie du code', () => {
    component.copied.set(true);
    fixture.detectChanges();

    expect(element.querySelector('.copied')?.textContent).toContain('Copié');
    expect(element.querySelector('.room-code .bx-check')).toBeTruthy();
  });

  it('ecrit le code puis fait entrer les invites', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();

    expect(
      element.querySelector('.code')?.textContent?.replace(/\s/g, ''),
    ).toBe(ROOM_CODE);
    expect(component.copied()).toBe(false);
    expect(element.querySelectorAll('.player:not(.waiting)')).toHaveLength(
      GUESTS.length + 1,
    );
    expect(element.querySelector('.bxs-key')).toBeTruthy();
    expect(element.querySelector('.bx-link')).toBeTruthy();
  });
});
