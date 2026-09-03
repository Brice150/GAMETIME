import { TestBed } from '@angular/core/testing';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { WaitingRoomComponent } from './waiting-room.component';

describe('WaitingRoomComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingRoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WaitingRoomComponent);
    fixture.componentRef.setInput('room', buildRoom());
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.componentRef.setInput('players', [buildPlayer()]);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
