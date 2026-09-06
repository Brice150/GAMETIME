import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appTestProviders } from '../../../testing/test-providers';
import { JoinRoomComponent } from './join-room.component';

describe('JoinRoomComponent', () => {
  async function build(): Promise<JoinRoomComponent> {
    await TestBed.configureTestingModule({
      imports: [JoinRoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(JoinRoomComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('saisie du code', () => {
    function press(component: JoinRoomComponent, key: string): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      component.onKeyDown(event);
      return event;
    }

    it('accepte lettres et chiffres', async () => {
      const component = await build();

      expect(press(component, 'a').defaultPrevented).toBe(false);
      expect(press(component, 'Z').defaultPrevented).toBe(false);
      expect(press(component, '7').defaultPrevented).toBe(false);
    });

    it('laisse passer les touches d edition', async () => {
      const component = await build();

      for (const key of [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'Enter',
      ]) {
        expect(press(component, key).defaultPrevented).toBe(false);
      }
    });

    it('refuse tout le reste', async () => {
      const component = await build();

      expect(press(component, '-').defaultPrevented).toBe(true);
      expect(press(component, 'é').defaultPrevented).toBe(true);
    });
  });

  describe('entree dans la room', () => {
    it('emet un code de quatre caracteres, en majuscules et sans accent', async () => {
      const component = await build();
      const emitted = vi.fn();
      component.joinRoomEvent.subscribe(emitted);
      component.roomCode = 'abéd';

      component.joinRoom();

      expect(emitted).toHaveBeenCalledWith('ABED');
    });

    it('refuse un code de longueur differente', async () => {
      const component = await build();
      const emitted = vi.fn();
      component.joinRoomEvent.subscribe(emitted);
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.roomCode = 'abc';
      component.joinRoom();

      component.roomCode = undefined;
      component.joinRoom();

      expect(emitted).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(2);
      expect(error).toHaveBeenCalledWith(
        'Le code de la room doit faire 4 caractères',
      );
    });
  });
});
