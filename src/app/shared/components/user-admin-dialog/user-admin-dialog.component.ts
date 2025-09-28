import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Player } from 'src/app/core/interfaces/player';
import { Stat } from 'src/app/core/interfaces/stat';
import { animalsWithEmojis } from 'src/assets/data/animals';
import { gameMap } from 'src/assets/data/games';

@Component({
  selector: 'app-admin-user-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './user-admin-dialog.component.html',
  styleUrl: './user-admin-dialog.component.css',
})
export class UserAdminDialogComponent implements OnInit {
  userForm!: FormGroup;
  fb = inject(FormBuilder);
  player?: Player;
  animals = animalsWithEmojis;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;

  constructor(
    public dialogRef: MatDialogRef<UserAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Player
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.player = this.data;
    }

    this.userForm = this.fb.group({
      username: [
        this.player?.username,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(40),
        ],
      ],
      animal: [this.player?.animal, [Validators.required]],
      drapeauxMedalsNumber: [
        this.player?.stats.find(
          (stat) => stat.gameName === this.drapeauxGameKey
        )?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      marquesMedalsNumber: [
        this.player?.stats.find((stat) => stat.gameName === this.marquesGameKey)
          ?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      motusMedalsNumber: [
        this.player?.stats.find((stat) => stat.gameName === this.motusGameKey)
          ?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
      quizMedalsNumber: [
        this.player?.stats.find((stat) => stat.gameName === this.quizGameKey)
          ?.medalsNumber,
        [Validators.required, Validators.min(0), Validators.max(99999)],
      ],
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (this.userForm.valid) {
      this.player!.username = this.userForm.value.username;
      this.player!.animal = this.userForm.value.animal;

      this.updateOrCreateStat(
        this.drapeauxGameKey,
        this.userForm.value.drapeauxMedalsNumber
      );
      this.updateOrCreateStat(
        this.motusGameKey,
        this.userForm.value.motusMedalsNumber
      );
      this.updateOrCreateStat(
        this.marquesGameKey,
        this.userForm.value.marquesMedalsNumber
      );
      this.updateOrCreateStat(
        this.quizGameKey,
        this.userForm.value.quizMedalsNumber
      );

      this.dialogRef.close(this.player);
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  updateOrCreateStat(gameName: string, medalsNumber: number): void {
    let stat = this.player!.stats.find((s) => s.gameName === gameName);
    if (stat) {
      stat.medalsNumber = medalsNumber;
    } else {
      const newStat: Stat = { gameName, medalsNumber, lastSuccessRetrieved: 0 };
      this.player!.stats.push(newStat);
    }
  }
}
