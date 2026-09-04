import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { voteOptions } from '../../../assets/data/games';
import { buildPlayer } from '../../../testing/test-providers';
import { VotePanelComponent } from './vote-panel.component';

describe('VotePanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotePanelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('compte les votes exprimes et ignore les joueurs muets', () => {
    const fixture = TestBed.createComponent(VotePanelComponent);
    fixture.componentRef.setInput('players', [
      buildPlayer({ id: 'p1', userId: 'host', vote: 'motus' }),
      buildPlayer({ id: 'p2', userId: 'other', vote: 'motus' }),
      buildPlayer({ id: 'p3', userId: 'third', vote: null }),
    ]);
    fixture.componentRef.setInput('options', voteOptions);
    fixture.componentRef.setInput('currentPlayerId', 'host');
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.voteCounts()).toEqual({ motus: 2 });
    expect(component.votedCount()).toBe(2);
    expect(component.myVote()).toBe('motus');
  });
});
