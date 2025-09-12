import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { RoomForm } from 'src/app/core/interfaces/room-form';
import { gameMap, games } from 'src/assets/data/games';

@Component({
  selector: 'app-add-room-dialog',
  imports: [
    CommonModule,
    MatSliderModule,
    FormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-room-dialog.component.html',
  styleUrl: './add-room-dialog.component.css',
})
export class AddRoomDialogComponent implements OnInit {
  games = games;
  stepsNumber: number = 3;
  startWordLength: number = 5;
  categoryFilter: number = 1;
  difficultyFilter: number = 2;
  isWordLengthIncreasing = true;
  showFirstLetterMotus = true;
  showFirstLetterDrapeaux = false;
  showFirstLetterMarques = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  gameSelected: string = this.drapeauxGameKey;
  startAgainMode = false;

  get maxWordLength(): number {
    if (this.isWordLengthIncreasing) {
      return 13 - (this.stepsNumber - 1);
    }
    return 13;
  }

  constructor(
    public dialogRef: MatDialogRef<AddRoomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.startAgainMode = this.data === 'startAgain';
    }
  }

  formatLabelContinent(index: number): string {
    const continentLabels = [
      '', // index 0 unused
      'Monde',
      'Europe',
      'Asie',
      'Afrique',
      'Amérique',
      'Océanie',
    ];

    return continentLabels[index];
  }

  formatLabelMarques(index: number): string {
    const marquesLabels = [
      '', // index 0 unused
      'Tout',
      'Voitures',
      'Digital',
      'Mode',
      'Aliments',
    ];
    return marquesLabels[index];
  }

  formatLabelQuizCategory(index: number): string {
    const quizLabels = [
      '', // index 0 unused
      'Général',
      'Sciences',
      'Histoire',
      'Géographie',
      'Arts',
      'Sport',
    ];
    return quizLabels[index];
  }

  formatLabelQuizDifficulty(index: number): string {
    const quizLabels = [
      '', // index 0 unused
      'Facile',
      'Moyenne',
      'Difficile',
    ];
    return quizLabels[index];
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close({
      gameSelected: this.gameSelected,
      showFirstLetterMotus: this.showFirstLetterMotus,
      showFirstLetterDrapeaux: this.showFirstLetterDrapeaux,
      showFirstLetterMarques: this.showFirstLetterMarques,
      stepsNumber: this.stepsNumber,
      isWordLengthIncreasing: this.isWordLengthIncreasing,
      startWordLength: this.startWordLength,
      categoryFilter: this.categoryFilter,
      difficultyFilter: this.difficultyFilter,
    } as RoomForm);
  }

  keepSameSettingsConfirm(): void {
    this.dialogRef.close({});
  }
}
