import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { filter, Subject, switchMap, takeUntil } from 'rxjs';
import { Room } from '../core/interfaces/room';
import { RoomService } from '../core/services/room.service';
import { DurationBetweenDatesPipe } from '../shared/pipes/duration.pipe';
import { PlayerService } from '../core/services/player.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-room',
  imports: [
    CommonModule,
    DurationBetweenDatesPipe,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-room.component.html',
  styleUrl: './admin-room.component.css',
})
export class AdminRoomComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  room: Room = {} as Room;
  roomService = inject(RoomService);
  activatedRoute = inject(ActivatedRoute);
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  dialog = inject(MatDialog);
  destroyed$ = new Subject<void>();
  hideResults = true;

  get sortedPlayersRoom() {
    const room = this.room;
    if (!room || !room.playersRoom) return [];

    return [...room.playersRoom].sort((a, b) => {
      const aTrueCount = a.currentRoomWins.filter(Boolean).length;
      const bTrueCount = b.currentRoomWins.filter(Boolean).length;

      if (bTrueCount !== aTrueCount) {
        return bTrueCount - aTrueCount;
      }

      const aFinish = this.toJsDate(a.finishDate).getTime();
      const bFinish = this.toJsDate(b.finishDate).getTime();

      return aFinish - bFinish;
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params) => this.roomService.getRoom(params['id']))
      )
      .subscribe({
        next: (room) => {
          this.room = room;
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

  toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }

  share(): void {
    const link = window.location.href;

    navigator.clipboard.writeText(link).then(() => {
      this.toastr.info('Lien de la partie copié', 'Game Time', {
        positionClass: 'toast-bottom-center',
        toastClass: 'ngx-toastr custom info',
      });
    });
  }

  start(): void {
    this.loading = true;

    this.room.countries = [];
    this.room.responses = [];

    this.room.isStarted = true;
    this.room.startDate = new Date();
    this.room.startAgainNumber += 1;
    this.room.playersRoom.forEach((player) => {
      player.isOver = false;
      player.finishDate = null;
      player.currentRoomWins = [];
    });

    this.roomService.generateResponses(
      this.room.gameName,
      this.room.stepsNumber,
      this.room.continentFilter,
      this.room.isWordLengthIncreasing,
      this.room.startWordLength,
      this.room.countries,
      this.room.responses
    );

    this.updateRoomAndHandleResponse(() => {
      if (this.room.userId === this.playerService.currentPlayerSig()?.userId) {
        this.localStorageService.saveStartAgainNumber(
          this.room.startAgainNumber
        );
      }
    });
  }

  stop(): void {
    this.loading = true;

    this.room.playersRoom.forEach((player) => {
      player.isOver = true;
      for (let i = 0; i < this.room.responses.length; i++) {
        if (player.currentRoomWins[i] === undefined) {
          player.currentRoomWins.push(false);
        }
      }
    });

    this.updateRoomAndHandleResponse(() => {
      if (this.room.userId === this.playerService.currentPlayerSig()?.userId) {
        this.localStorageService.saveStartAgainNumber(
          this.room.startAgainNumber
        );
        this.localStorageService.saveTries([]);
      }
    });
  }

  allPlayersDone(): boolean {
    return this.room.playersRoom.every((player) => player.isOver);
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer cette room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading = true;
          return this.roomService.deleteRoom(this.room.id!);
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

  updateRoomAndHandleResponse(
    onSuccess: () => void,
    onError?: (error: HttpErrorResponse) => void
  ): void {
    this.roomService
      .updateRoom(this.room)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          onSuccess();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (onError) {
            onError(error);
          } else if (
            !error.message.includes('Missing or insufficient permissions.')
          ) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }
}
