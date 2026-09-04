import { TestBed } from '@angular/core/testing';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { WaitingRoomComponent } from './waiting-room.component';

describe('WaitingRoomComponent', () => {
  async function build(players = [buildPlayer()]) {
    await TestBed.configureTestingModule({
      imports: [WaitingRoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WaitingRoomComponent);
    fixture.componentRef.setInput('room', buildRoom({ userId: 'u1' }));
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();

    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('propose le vote des qu un autre joueur est la', async () => {
    const fixture = await build([
      buildPlayer(),
      buildPlayer({ id: 'p2', userId: 'u2' }),
    ]);

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-vote-panel')).toBeTruthy();
  });

  it('masque le vote tant que l hote est seul', async () => {
    const fixture = await build();

    expect(fixture.nativeElement.querySelector('app-vote-panel')).toBeNull();
  });
});
