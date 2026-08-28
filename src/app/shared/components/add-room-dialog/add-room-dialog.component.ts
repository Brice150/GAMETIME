import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { gameMap, games } from '../../../../assets/data/games';
import { BrandCategory } from '../../../core/enums/brand-category.enum';
import { Continent } from '../../../core/enums/continent.enum';
import { RoomForm } from '../../../core/interfaces/room-form';

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
  dialogRef = inject(MatDialogRef<AddRoomDialogComponent>);
  data = inject<RoomForm>(MAT_DIALOG_DATA);
  games = games;
  stepsNumber = 3;
  startWordLength = 5;
  categoryFilter = '1';
  isWordLengthIncreasing = true;
  showFirstLetterMotus = true;
  showFirstLetterDrapeaux = false;
  showFirstLetterMarques = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  gameSelected: string = this.drapeauxGameKey;
  startAgainMode = false;

  get maxWordLength(): number {
    if (this.isWordLengthIncreasing) {
      return 13 - (this.stepsNumber - 1);
    }
    return 13;
  }

  ngOnInit(): void {
    if (this.data) {
      this.startAgainMode = !!this.data.startAgainMode;
      if (this.startAgainMode) {
        this.stepsNumber = this.data.stepsNumber ?? 3;
        this.startWordLength = this.data.startWordLength ?? 5;
        this.categoryFilter = this.data.categoryFilter?.toString() ?? '1';
        this.isWordLengthIncreasing = this.data.isWordLengthIncreasing ?? true;
        this.showFirstLetterMotus = this.data.showFirstLetterMotus ?? true;
        this.showFirstLetterDrapeaux =
          this.data.showFirstLetterDrapeaux ?? false;
        this.showFirstLetterMarques = this.data.showFirstLetterMarques ?? false;
        this.gameSelected = this.data.gameSelected ?? this.drapeauxGameKey;
      }
    }
  }

  formatLabelContinent(index: number): string {
    return Continent[index] ?? Continent[1];
  }

  formatLabelMarques(index: number): string {
    return BrandCategory[index] ?? BrandCategory[1];
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
      categoryFilter: Number(this.categoryFilter),
    } as RoomForm);
  }

  keepSameSettingsConfirm(): void {
    this.dialogRef.close({});
  }
}
