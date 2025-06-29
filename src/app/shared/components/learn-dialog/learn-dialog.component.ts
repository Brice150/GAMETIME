import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-learn-dialog',
  imports: [CommonModule, MatExpansionModule],
  templateUrl: './learn-dialog.component.html',
  styleUrls: ['./learn-dialog.component.css'],
})
export class LearnDialogComponent {
  dialogRef = inject<MatDialogRef<LearnDialogComponent>>(MatDialogRef);

  imagePath: string = environment.imagePath + '/learn/';

  cancel(): void {
    this.dialogRef.close(false);
  }
}
