import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-multiplayer-dialog',
  imports: [CommonModule],
  templateUrl: './multiplayer-dialog.component.html',
  styleUrl: './multiplayer-dialog.component.css',
})
export class MultiplayerDialogComponent implements OnInit {
  toastr = inject(ToastrService);
  roomCode: string = '';
  link: string = '';

  constructor(
    public dialogRef: MatDialogRef<MultiplayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.roomCode = this.data;
    }
    this.link = window.location.href.replace('/admin/', '/room/');
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.roomCode).then(() => {
      this.toastr.info('Code de la partie copié', 'Game Time', {
        positionClass: 'toast-top-center',
        toastClass: 'ngx-toastr custom info',
      });
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.link).then(() => {
      this.toastr.info('Lien de la partie copié', 'Game Time', {
        positionClass: 'toast-top-center',
        toastClass: 'ngx-toastr custom info',
      });
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
