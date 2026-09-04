import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RoomForm } from '../../../core/interfaces/room-form';
import { AddRoomDialogComponent } from './add-room-dialog.component';

describe('AddRoomDialogComponent', () => {
  let closed: RoomForm | undefined;

  function build(data: Partial<RoomForm> | null = null) {
    closed = undefined;

    TestBed.configureTestingModule({
      imports: [AddRoomDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        {
          provide: MatDialogRef,
          useValue: {
            close: (value: RoomForm) => {
              closed = value;
            },
          },
        },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    const fixture = TestBed.createComponent(AddRoomDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('ramene la taille du mot dans la borne imposee par le nombre de manches', () => {
    const component = build();
    component.selectGame('motus');
    component.isWordLengthIncreasing = true;
    // Taille choisie avec une seule manche, puis nombre de manches augmente.
    component.startWordLength = 13;
    component.stepsNumber = 8;

    component.confirm();

    expect(component.maxWordLength).toBe(6);
    expect(closed?.startWordLength).toBe(6);
  });

  it('laisse la taille inchangee quand elle tient dans la borne', () => {
    const component = build();
    component.selectGame('motus');
    component.isWordLengthIncreasing = true;
    component.startWordLength = 5;
    component.stepsNumber = 3;

    component.confirm();

    expect(closed?.startWordLength).toBe(5);
  });

  it('applique le filtre le plus large en mode aleatoire', () => {
    const component = build();
    component.selectGame(component.randomGameKey);
    component.categoryFilter = 4;

    component.confirm();

    expect(closed?.categoryFilter).toBe(1);
  });

  it('propose le reglage de longueur a Motus seul', () => {
    const component = build();

    component.selectGame('motus');
    expect(component.hasWordLength()).toBeTrue();
    expect(component.filterLabels()).toEqual([]);

    component.selectGame('drapeaux');
    expect(component.hasWordLength()).toBeFalse();
    expect(component.filterLabels().length).toBe(6);
    expect(component.formatFilter(2)).toBe('Europe');
  });

  it('ramene le filtre au plus large en changeant de jeu', () => {
    const component = build();
    component.selectGame('drapeaux');
    component.categoryFilter = 5;

    // Le rang 5 ne designe pas la meme chose d'un jeu a l'autre.
    component.selectGame('marques');

    expect(component.categoryFilter).toBe(1);
  });

  it('reprend les reglages de la partie precedente', () => {
    const component = build({
      gameSelected: 'marques',
      stepsNumber: 6,
      categoryFilter: 3,
      showFirstLetter: true,
    });

    expect(component.gameSelected()).toBe('marques');
    expect(component.stepsNumber).toBe(6);
    expect(component.categoryFilter).toBe(3);
    expect(component.showFirstLetter).toBeTrue();
  });
});
