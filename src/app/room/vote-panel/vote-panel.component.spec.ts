import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { voteGroups } from '../../../assets/data/games';
import { buildPlayer } from '../../../testing/test-providers';
import { VotePanelComponent } from './vote-panel.component';

describe('VotePanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotePanelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function build(currentPlayerId: string, hostId?: string) {
    const fixture = TestBed.createComponent(VotePanelComponent);
    fixture.componentRef.setInput('players', [
      buildPlayer({ id: 'p1', userId: 'host', vote: 'motus' }),
      buildPlayer({ id: 'p2', userId: 'other', vote: 'motus' }),
      buildPlayer({ id: 'p3', userId: 'third', vote: null }),
    ]);
    fixture.componentRef.setInput('groups', voteGroups);
    fixture.componentRef.setInput('currentPlayerId', currentPlayerId);
    fixture.componentRef.setInput('hostId', hostId);
    fixture.detectChanges();

    return fixture;
  }

  it('compte les votes exprimes et ignore les joueurs muets', () => {
    const component = build('host').componentInstance;

    expect(component.voteCounts()).toEqual({ motus: 2 });
    expect(component.votedCount()).toBe(2);
    expect(component.myVote()).toBe('motus');
  });

  it('sort l hote du scrutin', () => {
    const component = build('other', 'host').componentInstance;

    expect(component.voters().length).toBe(2);
    expect(component.voteCounts()).toEqual({ motus: 1 });
    expect(component.votedCount()).toBe(1);
  });

  it('presente le depouillement a l hote sans bulletin', () => {
    const fixture = build('host', 'host');
    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.vote-option'),
    );
    const emitted: string[] = [];
    fixture.componentInstance.voteEvent.subscribe((choice) =>
      emitted.push(choice),
    );

    expect(fixture.componentInstance.canVote()).toBeFalse();
    expect(options.every((option) => option.disabled)).toBeTrue();

    fixture.componentInstance.vote('motus');
    expect(emitted).toEqual([]);
  });

  it('laisse voter un joueur qui n est pas l hote', () => {
    const fixture = build('other', 'host');
    const emitted: string[] = [];
    fixture.componentInstance.voteEvent.subscribe((choice) =>
      emitted.push(choice),
    );

    fixture.componentInstance.vote('drapeaux');

    expect(fixture.componentInstance.canVote()).toBeTrue();
    expect(emitted).toEqual(['drapeaux']);
  });
});
