import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-learn-dialog',
  templateUrl: './learn-dialog.component.html',
  styleUrls: ['./learn-dialog.component.css']
})
export class LearnDialogComponent {
  constructor(public dialogRef: MatDialogRef<LearnDialogComponent>) {}

  cancel(): void {
    this.dialogRef.close(false);
  }
}