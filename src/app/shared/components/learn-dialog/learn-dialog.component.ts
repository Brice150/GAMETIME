import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-learn-dialog',
    templateUrl: './learn-dialog.component.html',
    styleUrls: ['./learn-dialog.component.css'],
    standalone: false
})
export class LearnDialogComponent {
  imagePath: string = environment.imagePath + '/learn/';

  constructor(public dialogRef: MatDialogRef<LearnDialogComponent>) {}

  cancel(): void {
    this.dialogRef.close(false);
  }
}
