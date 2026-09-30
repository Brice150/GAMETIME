import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  startMotion,
  type MotionScript,
  type MotionStep,
} from '../motion-player';

export interface LobbyPlayer {
  name: string;
  animal: string;
  medals: number;
  // Comment il est entre : l'hote cree le salon, les autres tapent le code
  // ou suivent le lien.
  via: 'host' | 'code' | 'link';
}

export const ROOM_CODE = 'KKFN';
export const HOST: LobbyPlayer = {
  name: 'Vous',
  animal: '🐱',
  medals: 2169,
  via: 'host',
};
export const GUESTS: LobbyPlayer[] = [
  { name: 'Léa', animal: '🦊', medals: 412, via: 'code' },
  { name: 'Tom', animal: '🐧', medals: 87, via: 'link' },
];

// Salon prive : le code s'ecrit, se copie, et les amis arrivent un a un.
@Component({
  selector: 'app-motion-lobby',
  templateUrl: './motion-lobby.component.html',
  styleUrls: ['../motion-stage.css', './motion-lobby.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label':
      'Salon privé : le code de la partie s’affiche et deux amis rejoignent',
  },
})
export class MotionLobbyComponent implements MotionScript {
  readonly slots = ROOM_CODE.split('');
  readonly typed = signal(0);
  readonly copied = signal(false);
  readonly players = signal<LobbyPlayer[]>([HOST]);

  constructor() {
    startMotion(this);
  }

  reset(): void {
    this.typed.set(0);
    this.copied.set(false);
    this.players.set([HOST]);
  }

  async play(step: MotionStep): Promise<void> {
    while (this.typed() < ROOM_CODE.length) {
      await step.wait(220);
      this.typed.update((typed) => typed + 1);
    }

    await step.wait(450);
    this.copied.set(true);
    await step.wait(1100);
    this.copied.set(false);

    for (const guest of GUESTS) {
      await step.wait(800);
      this.players.update((players) => [...players, guest]);
    }
  }
}
