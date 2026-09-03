import { TestBed } from '@angular/core/testing';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { WordGamesComponent } from './word-games.component';

describe('WordGamesComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [WordGamesComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WordGamesComponent);
    fixture.componentRef.setInput('room', buildRoom());
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
