import { TestBed } from '@angular/core/testing';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { LiveStandingsComponent } from './live-standings.component';

describe('LiveStandingsComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [LiveStandingsComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(LiveStandingsComponent);
    fixture.componentRef.setInput('room', buildRoom());
    fixture.componentRef.setInput('players', [buildPlayer()]);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
