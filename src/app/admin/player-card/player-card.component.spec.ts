import { TestBed } from '@angular/core/testing';
import { appTestProviders, buildPlayer } from '../../../testing/test-providers';
import { PlayerCardComponent } from './player-card.component';

describe('PlayerCardComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(PlayerCardComponent);
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
