import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { RoomForm } from 'src/app/core/interfaces/room-form';
import { gameMap, games } from 'src/assets/data/games';

@Component({
  selector: 'app-add-room-dialog',
  imports: [CommonModule, MatSliderModule, FormsModule, MatSlideToggleModule],
  templateUrl: './add-room-dialog.component.html',
  styleUrl: './add-room-dialog.component.css',
})
export class AddRoomDialogComponent implements OnInit {
  games = games;
  stepsNumber: number = 3;
  startWordLength: number = 5;
  continentFilter: number = 1;
  isWordLengthIncreasing = true;
  showFirstLetterMotus = true;
  showFirstLetterDrapeaux = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  gameSelected: string = 'motus';
  startAgainMode = false;

  get dynamicSliderValue(): number {
    return this.gameSelected === this.motusGameKey
      ? this.startWordLength
      : this.continentFilter;
  }

  set dynamicSliderValue(value: number) {
    if (this.gameSelected === this.motusGameKey) {
      this.startWordLength = value;
    } else {
      this.continentFilter = value;
    }
  }

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

  formatLabel(index: number): string {
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

  defaultFormatLabel(value: number): string {
    return value.toString();
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close({
      gameSelected: this.gameSelected,
      showFirstLetterMotus: this.showFirstLetterMotus,
      showFirstLetterDrapeaux: this.showFirstLetterDrapeaux,
      stepsNumber: this.stepsNumber,
      isWordLengthIncreasing: this.isWordLengthIncreasing,
      startWordLength: this.startWordLength,
      continentFilter: this.continentFilter,
    } as RoomForm);
  }

  keepSameSettingsConfirm(): void {
    this.dialogRef.close({});
  }
}
