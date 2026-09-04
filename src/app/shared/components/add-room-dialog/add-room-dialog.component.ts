import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { gameMap, gamesByCategory } from '../../../../assets/data/games';
import { GameDefinition } from '../../../core/interfaces/game';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRoomDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddRoomDialogComponent>);
  data = inject<RoomForm>(MAT_DIALOG_DATA);
  // Les jeux sont proposes ranges par categorie.
  gameGroups = gamesByCategory();
  stepsNumber = 3;
  startWordLength = 5;
  categoryFilter = 1;
  isWordLengthIncreasing = true;
  showFirstLetter = false;
  readonly gameSelected = signal('drapeaux');

  // Toute la mise en forme de la fenetre se lit dans le descripteur du jeu :
  // filtre propose ou non, reglage de longueur de mot, libelles du curseur.
  readonly game = computed<GameDefinition | undefined>(
    () => gameMap[this.gameSelected()],
  );

  readonly filterLabels = computed(() => this.game()?.filterLabels ?? []);

  readonly hasWordLength = computed(() => !!this.game()?.hasWordLength);

  get maxWordLength(): number {
    if (this.isWordLengthIncreasing) {
      return 13 - (this.stepsNumber - 1);
    }
    return 13;
  }

  // Les reglages de la partie precedente sont toujours repris : un vote
  // « Recommencer » n'a alors plus qu'a etre valide, et les autres n'ont que
  // le jeu a changer.
  ngOnInit(): void {
    if (!this.data) {
      return;
    }

    this.gameSelected.set(this.data.gameSelected || 'drapeaux');
    this.stepsNumber = this.data.stepsNumber ?? 3;
    this.startWordLength = this.data.startWordLength ?? 5;
    this.categoryFilter = Number(this.data.categoryFilter) || 1;
    this.isWordLengthIncreasing = this.data.isWordLengthIncreasing ?? true;
    this.showFirstLetter =
      this.data.showFirstLetter ?? !!this.game()?.showFirstLetter;
  }

  // Le curseur affiche le libelle du filtre, pas son rang.
  readonly formatFilter = (value: number): string =>
    this.filterLabels()[value - 1] ?? '';

  selectGame(key: string): void {
    this.gameSelected.set(key);

    // Les filtres n'ont pas le meme sens d'un jeu a l'autre : garder le rang
    // choisi pour les drapeaux appliquait un continent a une categorie de
    // marques. Le plus large, toujours en tete, sert de repli.
    this.categoryFilter = 1;
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close({
      gameSelected: this.gameSelected(),
      showFirstLetter: this.showFirstLetter,
      stepsNumber: this.stepsNumber,
      isWordLengthIncreasing: this.isWordLengthIncreasing,
      // La borne haute depend du nombre de manches : augmenter les manches
      // apres avoir choisi la taille laissait une valeur hors bornes, et la
      // partie rendait alors moins de manches que demande.
      startWordLength: Math.min(this.startWordLength, this.maxWordLength),
      categoryFilter: this.categoryFilter,
    } as RoomForm);
  }
}
