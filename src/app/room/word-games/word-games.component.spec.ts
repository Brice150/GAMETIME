import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
} from '../../../testing/test-providers';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { WordGamesComponent } from './word-games.component';

describe('WordGamesComponent', () => {
  async function buildFixture(
    room: Room = buildRoom(),
    player: Player = buildPlayer(),
  ): Promise<ComponentFixture<WordGamesComponent>> {
    await TestBed.configureTestingModule({
      imports: [WordGamesComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WordGamesComponent);
    fixture.componentRef.setInput('room', room);
    fixture.componentRef.setInput('player', player);
    fixture.detectChanges();
    return fixture;
  }

  async function build(
    room?: Room,
    player?: Player,
  ): Promise<WordGamesComponent> {
    return (await buildFixture(room, player)).componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('manche affichee', () => {
    it('ouvre sur la premiere manche', async () => {
      const component = await build();

      expect(component.currentIndex()).toBe(0);
      expect(component.response()).toBe('CHAT');
      expect(component.isOver()).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('reprend a la manche suivante d un joueur avance', async () => {
      const component = await build(
        buildRoom(),
        buildPlayer({ currentRoomWins: [true] }),
      );

      expect(component.currentIndex()).toBe(1);
      expect(component.response()).toBe('CHIEN');
    });

    it('declare la partie finie a la derniere manche jouee', async () => {
      const component = await build(
        buildRoom(),
        buildPlayer({ currentRoomWins: [true, true, true] }),
      );

      expect(component.isOver()).toBe(true);
    });

    it('nomme la categorie choisie a la creation', async () => {
      const component = await build(
        buildRoom({ gameName: 'drapeaux', categoryFilter: 2 }),
      );

      expect(component.categoryLabel()).toBe('Europe');
    });

    it('ne nomme aucune categorie pour un jeu qui n en propose pas', async () => {
      const component = await build(buildRoom({ gameName: 'motus' }));

      expect(component.categoryLabel()).toBe('');
    });
  });

  describe('images des manches', () => {
    const illustrated = (): Room =>
      buildRoom({
        gameName: 'drapeaux',
        responses: ['France', 'Italie', 'Espagne'],
        prompts: ['', '', ''],
        media: ['fr.webp', 'it.webp', 'es.webp'],
      });

    it('attend l image avant de lancer le chrono', async () => {
      const component = await build(illustrated());
      const startTimer = vi.spyOn(component.localStorageService, 'startTimer');

      expect(component.loading()).toBe(true);
      expect(component.imageUrl()).toBe('fr.webp');
      expect(startTimer).not.toHaveBeenCalled();
      expect(component.preloaders.size).toBe(0);
    });

    it('lance le chrono et precharge la suite une fois l image arrivee', async () => {
      const component = await build(illustrated());
      const startTimer = vi.spyOn(component.localStorageService, 'startTimer');

      component.imageLoaded();

      expect(component.loading()).toBe(false);
      expect(startTimer).toHaveBeenCalledWith('r1', 0);
      expect([...component.preloaders.keys()]).toEqual(['it.webp', 'es.webp']);
    });

    it('poursuit la partie quand l image manque', async () => {
      const component = await build(illustrated());

      component.imageFailed();

      expect(component.imageError()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('ne relance pas un telechargement deja parti', async () => {
      const component = await build(illustrated());

      component.preloadFrom(1);
      const first = component.preloaders.get('it.webp');
      component.preloadFrom(1);

      expect(component.preloaders.get('it.webp')).toBe(first);
    });

    it('lance le chrono aussitot pour un jeu sans image', async () => {
      const component = await build();

      expect(component.loading()).toBe(false);
      expect(component.imageUrl()).toBe('');
    });
  });

  describe('evenements', () => {
    it('remonte la manche terminee', async () => {
      const component = await build();
      const emitted = vi.fn();
      component.finishedStepEvent.subscribe(emitted);

      component.handleEvent({ won: true, answer: 'CHAT' });

      expect(emitted).toHaveBeenCalledWith({ won: true, answer: 'CHAT' });
    });

    it('remonte l avancee, rapportee a la longueur du mot', async () => {
      const component = await build();
      const emitted = vi.fn();
      component.progressEvent.subscribe(emitted);

      component.handleProgress(2);

      expect(emitted).toHaveBeenCalledWith({
        lettersFound: 2,
        lettersTotal: 4,
      });
    });
  });
});
