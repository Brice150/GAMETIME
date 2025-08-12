import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-join-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent {
  roomCode?: string;
  toastr = inject(ToastrService);
  @Output() joinRoomEvent = new EventEmitter<string>();

  onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const allowedSpecialKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
    ];

    const isAllowedCharacter = /^[A-Za-z0-9]$/.test(key);

    if (!isAllowedCharacter && !allowedSpecialKeys.includes(key)) {
      event.preventDefault();
    }
  }

  joinRoom(): void {
    if (this.roomCode && this.roomCode.length === 4) {
      this.joinRoomEvent.emit(
        this.roomCode
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase()
      );
    } else {
      this.toastr.error(
        'Le code de la room doit faire 4 caractères',
        'Game Time',
        {
          positionClass: 'toast-top-center',
          toastClass: 'ngx-toastr custom error',
        }
      );
    }
  }
}
