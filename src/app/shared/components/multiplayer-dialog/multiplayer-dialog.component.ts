import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QRCodeComponent } from 'angularx-qrcode';
import { take } from 'rxjs';
import { Player } from '../../../core/interfaces/player';
import { Room } from '../../../core/interfaces/room';
import { InvitationService } from '../../../core/services/invitation.service';
import { PlayerService } from '../../../core/services/player.service';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';

@Component({
  selector: 'app-multiplayer-dialog',
  imports: [CommonModule, QRCodeComponent, MatProgressSpinnerModule],
  templateUrl: './multiplayer-dialog.component.html',
  styleUrl: './multiplayer-dialog.component.css',
})
export class MultiplayerDialogComponent implements OnInit {
  toastrHelper = inject(ToastrHelperService);
  dialogRef = inject(MatDialogRef<MultiplayerDialogComponent>);
  playerService = inject(PlayerService);
  invitationService = inject(InvitationService);
  destroyRef = inject(DestroyRef);
  room = inject<Room>(MAT_DIALOG_DATA);
  roomCode = '';
  link = '';
  loadingFriends = true;
  friends: Player[] = [];
  readonly invitedIds = signal<string[]>([]);

  ngOnInit(): void {
    this.roomCode = this.room?.roomCode ?? '';
    this.link = window.location.href;
    this.loadFriends();
  }

  private loadFriends(): void {
    const friendIds = this.playerService.currentPlayerSig()?.friendIds ?? [];

    if (!friendIds.length) {
      this.loadingFriends = false;
      return;
    }

    // Requete ciblee sur les amis : charger toute la collection pour n'en
    // garder que quelques-uns ne passe pas l'echelle.
    this.playerService
      .getPlayers(friendIds)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.friends = [...players].sort((a, b) =>
            a.username.localeCompare(b.username),
          );
          this.loadingFriends = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loadingFriends = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  isInRoom(friend: Player): boolean {
    return !!friend.userId && !!this.room?.playerIds.includes(friend.userId);
  }

  isInvited(friend: Player): boolean {
    return !!friend.userId && this.invitedIds().includes(friend.userId);
  }

  invite(friend: Player): void {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer || !friend.userId) {
      return;
    }

    this.invitationService
      .sendInvitation(this.room, currentPlayer, friend.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.invitedIds.update((ids) => [...ids, friend.userId!]);
          this.toastrHelper.info(`${friend.username} a été invité`, 'Room');
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
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
