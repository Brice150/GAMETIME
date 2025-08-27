import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, switchMap, take, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { JoinRoomComponent } from './join-room/join-room.component';
import { Room } from '../core/interfaces/room';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    FormsModule,
    MatSlideToggleModule,
    MedalsNumberPipe,
    JoinRoomComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnDestroy {
  loading: boolean = false;
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  destroyed$ = new Subject<void>();
  router = inject(Router);
  games = games;

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  play(): void {
    this.loading = true;

    const newRoom = {
      gameName: 'room',
      playerIds: [this.playerService.currentPlayerSig()?.userId!],
      isStarted: false,
      startDate: null,
      startAgainNumber: 0,
      isCreatedByAdmin: false,
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
        next: (roomId) => {
          this.localStorageService.newGame(roomId);
          this.loading = false;
          this.router.navigate([`/room/${roomId}`]);
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

  joinRoom(roomCode: string): void {
    this.roomService
      .getRoomsByCode(roomCode)
      .pipe(take(1))
      .subscribe((rooms) => {
        if (rooms && rooms.length > 0) {
          const room = rooms[0];
          this.localStorageService.newGame(room.id!);
          this.loading = false;
          this.router.navigate([`/room/${room.id!}`]);
        } else {
          this.toastr.error('Aucune room trouvée avec ce code', 'Game Time', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          });
        }
      });
  }
}
