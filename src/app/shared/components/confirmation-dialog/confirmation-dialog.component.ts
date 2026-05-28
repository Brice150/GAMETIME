import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css',
})
export class ConfirmationDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  data = inject<string>(MAT_DIALOG_DATA);
  action = 'delete';

  ngOnInit(): void {
    if (this.data) {
      this.action = this.data;
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
