import { TestBed } from '@angular/core/testing';
import { appTestProviders, buildPlayer } from '../../testing/test-providers';
import { RoomComponent } from './room.component';

describe('RoomComponent', () => {
  async function build(): Promise<RoomComponent> {
    await TestBed.configureTestingModule({
      imports: [RoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(RoomComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('designe le jeu majoritaire', async () => {
    const component = await build();
    component.players = [
      buildPlayer({ id: 'p1', userId: 'u1', vote: 'motus' }),
      buildPlayer({ id: 'p2', userId: 'u2', vote: 'motus' }),
      buildPlayer({ id: 'p3', userId: 'u3', vote: 'drapeaux' }),
    ];

    expect(component.winningVote()).toBe('motus');
  });

  it('compte un joueur sans vote comme « Peu importe »', async () => {
    const component = await build();
    component.players = [
      buildPlayer({ id: 'p1', userId: 'u1', vote: 'aleatoire' }),
      buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
      buildPlayer({ id: 'p3', userId: 'u3', vote: 'motus' }),
    ];

    expect(component.winningVote()).toBe('aleatoire');
  });

  it('tranche une egalite en faveur du premier choix propose', async () => {
    const component = await build();
    component.players = [
      buildPlayer({ id: 'p1', userId: 'u1', vote: 'motus' }),
      buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
    ];

    expect(component.winningVote()).toBe('motus');
  });

  it('ne designe rien quand personne n a vote', async () => {
    const component = await build();
    component.players = [
      buildPlayer({ id: 'p1', userId: 'u1', vote: null }),
      buildPlayer({ id: 'p2', userId: 'u2', vote: null }),
    ];

    expect(component.winningVote()).toBeNull();
  });
});
