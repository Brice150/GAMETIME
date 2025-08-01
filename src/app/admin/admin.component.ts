import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'ngx-toastr';
import { filter, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RoomCardComponent } from './room-card/room-card.component';
import { AddRoomDialogComponent } from '../shared/components/add-room-dialog/add-room-dialog.component';
import { RoomForm } from '../core/interfaces/room-form';

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
  player: Player = {} as Player;
  rooms: Room[] = [];
  loading: boolean = true;
  isMulti: boolean = true;

  get filteredRooms(): Room[] {
    return this.rooms.filter((room) => room.isSolo !== this.isMulti);
  }

  ngOnInit(): void {
    this.playerService.playerReady$
      .pipe(
        tap((player) => (this.player = player)),
        switchMap(() => this.roomService.getRooms())
      )
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
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
            positionClass: 'toast-bottom-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  openAddRoomDialog(): void {
    const dialogRef = this.dialog.open(AddRoomDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(
        filter((roomData: RoomForm) => !!roomData),
        switchMap((roomData: RoomForm) => {
          this.loading = true;
          return this.roomService.deleteUserRooms().pipe(
            switchMap(() => {
              const newRoom = this.roomService.newRoom(
                roomData.gameSelected,
                'multi',
                roomData.showFirstLetterMotus,
                roomData.showFirstLetterDrapeaux,
                roomData.stepsNumber,
                roomData.isWordLengthIncreasing,
                roomData.startWordLength,
                roomData.continentFilter,
                this.playerService.currentPlayerSig()!,
                true
              );
              return this.roomService.addRoom(newRoom);
            })
          );
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('Room créée', 'Admin', {
            positionClass: 'toast-bottom-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }
}
