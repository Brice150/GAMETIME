import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'ngx-toastr';
import { filter, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RoomCardComponent } from './room-card/room-card.component';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    RoomCardComponent,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  destroyed$ = new Subject<void>();
  toastr = inject(ToastrService);
  dialog = inject(MatDialog);
  rooms: Room[] = [];
  playersByRoom: Record<string, Player[]> = {};
  loading: boolean = true;

  ngOnInit(): void {
    this.roomService
      .getRooms()
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((rooms) => {
          this.rooms = rooms;

          const allPlayerIds = Array.from(
            new Set(rooms.flatMap((room) => room.playerIds || []))
          );

          if (!allPlayerIds.length) {
            return of({ rooms, players: [] });
          }

          return this.playerService.getPlayers(allPlayerIds).pipe(
            takeUntil(this.destroyed$),
            map((players) => ({ rooms, players }))
          );
        })
      )
      .subscribe({
        next: ({ rooms, players }) => {
          this.playersByRoom = rooms.reduce((acc, room) => {
            const playerIds = room.playerIds || [];
            acc[room.id!] = playerIds
              .map((id) => players.find((p) => p.userId === id))
              .filter((p): p is Player => !!p);
            return acc;
          }, {} as Record<string, Player[]>);

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  openDialog(roomId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer cette room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading = true;
          return this.roomService.deleteRoom(roomId);
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('Room supprimée', 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  addRoom(): void {
    this.loading = true;

    const newRoom = {
      gameName: 'room',
      playerIds: [] as string[],
      isStarted: false,
      startDate: null,
      startAgainNumber: 0,
      isCreatedByAdmin: true,
      isReadyNotificationActivated: false,
      roomCode: this.roomService.generateRoomCode(),
    };

    this.roomService
      .deleteUserRooms()
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => this.roomService.addRoom(newRoom as Room))
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('Room créée', 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }
}
