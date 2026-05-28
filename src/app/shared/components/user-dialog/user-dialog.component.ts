import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { animalsWithEmojis } from '../../../../assets/data/animals';
import { Player } from '../../../core/interfaces/player';

@Component({
  selector: 'app-user-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css',
})
export class UserDialogComponent implements OnInit {
  userForm!: FormGroup;
  fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<UserDialogComponent>);
  data = inject<Player>(MAT_DIALOG_DATA);
  player?: Player;
  animals = animalsWithEmojis;

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
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
