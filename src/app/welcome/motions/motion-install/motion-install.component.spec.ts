import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { instantStep } from '../../../../testing/motion-step';
import { APP_COUNT, MotionInstallComponent } from './motion-install.component';

describe('MotionInstallComponent', () => {
  let fixture: ComponentFixture<MotionInstallComponent>;
  let component: MotionInstallComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotionInstallComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('part d un ecran d accueil avec une place libre', () => {
    component.reset();
    fixture.detectChanges();

    expect(element.querySelectorAll('.apps .app')).toHaveLength(APP_COUNT);
    expect(element.querySelector('.app.is-free')).toBeTruthy();
    expect(element.querySelector('.sheet.is-open')).toBeNull();
    expect(element.querySelector('.notification.is-open')).toBeNull();
  });

  it('montre la proposition d installation', () => {
    component.sheet.set(true);
    component.pressed.set(true);
    fixture.detectChanges();

    expect(element.querySelector('.sheet.is-open')).toBeTruthy();
    expect(element.querySelector('.install.is-pressed')).toBeTruthy();
  });

  it('installe l application puis recoit une invitation', async () => {
    component.reset();
    await component.play(instantStep);
    fixture.detectChanges();

    expect(element.querySelector('.app.is-free')).toBeNull();
    expect(element.querySelector('.app.is-game')?.textContent).toContain(
      'Game Time',
    );
    expect(element.querySelector('.sheet.is-open')).toBeNull();
    expect(
      element.querySelector('.notification.is-open')?.textContent,
    ).toContain('vous invite');
  });
});
