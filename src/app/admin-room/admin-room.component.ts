import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { Room } from '../core/interfaces/room';
import { RoomService } from '../core/services/room.service';
import { DurationBetweenDatesPipe } from '../shared/pipes/duration.pipe';

@Component({
  selector: 'app-admin-room',
  imports: [CommonModule, DurationBetweenDatesPipe, MatProgressSpinnerModule],
  templateUrl: './admin-room.component.html',
  styleUrl: './admin-room.component.css',
})
export class AdminRoomComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  room: Room = {} as Room;
  roomService = inject(RoomService);
  activatedRoute = inject(ActivatedRoute);
  toastr = inject(ToastrService);
  destroyed$ = new Subject<void>();

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
}
