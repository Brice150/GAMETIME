import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  startMotion,
  type MotionScript,
  type MotionStep,
} from '../motion-player';

export const APP_COUNT = 12;
// Place laissee libre sur l'ecran d'accueil, ou l'icone vient se poser.
export const FREE_SLOT = 6;

// Installation : la proposition s'ouvre, on accepte, l'icone arrive sur
// l'ecran d'accueil, puis une invitation tombe en notification.
@Component({
  selector: 'app-motion-install',
  templateUrl: './motion-install.component.html',
  styleUrls: ['../motion-stage.css', './motion-install.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Installation : Game Time s’ajoute à l’écran d’accueil du téléphone et reçoit une invitation',
  },
})
export class MotionInstallComponent implements MotionScript {
  readonly logo = `${environment.imagePath}logo.svg`;
  readonly apps = Array.from({ length: APP_COUNT }, (unused, index) => index);
  readonly freeSlot = FREE_SLOT;
  readonly sheet = signal(false);
  readonly pressed = signal(false);
  readonly installed = signal(false);
  readonly notified = signal(false);

  constructor() {
    startMotion(this);
  }

  reset(): void {
    this.sheet.set(false);
    this.pressed.set(false);
    this.installed.set(false);
    this.notified.set(false);
  }

  async play(step: MotionStep): Promise<void> {
    await step.wait(500);
    this.sheet.set(true);
    await step.wait(1100);
    this.pressed.set(true);
    await step.wait(250);
    this.sheet.set(false);
    this.pressed.set(false);
    await step.wait(350);
    this.installed.set(true);
    await step.wait(1300);
    this.notified.set(true);
  }
}
