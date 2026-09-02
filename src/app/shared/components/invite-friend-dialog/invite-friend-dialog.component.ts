import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs';
import { Player } from '../../../core/interfaces/player';
import { Room } from '../../../core/interfaces/room';
import { InvitationService } from '../../../core/services/invitation.service';
import { PlayerService } from '../../../core/services/player.service';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';

@Component({
  selector: 'app-invite-friend-dialog',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './invite-friend-dialog.component.html',
  styleUrl: './invite-friend-dialog.component.css',
})
export class InviteFriendDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<InviteFriendDialogComponent>);
  playerService = inject(PlayerService);
  invitationService = inject(InvitationService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  room = inject<Room>(MAT_DIALOG_DATA);
  loading = true;
  friends: Player[] = [];
  readonly invitedIds = signal<string[]>([]);

  ngOnInit(): void {
    const currentPlayer = this.playerService.currentPlayerSig();
    const friendIds = currentPlayer?.friendIds ?? [];

    if (!friendIds.length) {
      this.loading = false;
      return;
    }

    this.playerService
      .getAllPlayers()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.friends = players
            .filter(
              (player) => !!player.userId && friendIds.includes(player.userId),
            )
            .sort((a, b) => a.username.localeCompare(b.username));
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  isInRoom(friend: Player): boolean {
    return !!friend.userId && this.room.playerIds.includes(friend.userId);
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

  close(): void {
    this.dialogRef.close();
  }
}
