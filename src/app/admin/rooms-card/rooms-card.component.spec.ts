import { TestBed } from '@angular/core/testing';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { RoomsCardComponent } from './rooms-card.component';

describe('RoomsCardComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [RoomsCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(RoomsCardComponent);
    fixture.componentRef.setInput('rooms', [buildRoom()]);
    fixture.componentRef.setInput('playersByRoom', { r1: [buildPlayer()] });
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
