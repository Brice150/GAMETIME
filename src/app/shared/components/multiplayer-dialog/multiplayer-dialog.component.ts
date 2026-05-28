import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-multiplayer-dialog',
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './multiplayer-dialog.component.html',
  styleUrl: './multiplayer-dialog.component.css',
})
export class MultiplayerDialogComponent implements OnInit {
  toastrHelper = inject(ToastrHelperService);
  dialogRef = inject(MatDialogRef<MultiplayerDialogComponent>);
  data = inject<string>(MAT_DIALOG_DATA);
  roomCode = '';
  link = '';

  ngOnInit(): void {
    if (this.data) {
      this.roomCode = this.data;
    }
    this.link = window.location.href.replace('/admin/', '/room/');
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.roomCode).then(() => {
      this.toastrHelper.info('Code de la partie copié', 'Code');
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.link).then(() => {
      this.toastrHelper.info('Lien de la partie copié', 'Lien');
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
