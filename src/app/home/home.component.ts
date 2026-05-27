import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { switchMap, take } from 'rxjs';
import { games } from '../../assets/data/games';
import { Room } from '../core/interfaces/room';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { TotalMedalsNumberPipe } from '../shared/pipes/total-medals-number.pipe';
import { JoinRoomComponent } from './join-room/join-room.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MedalsNumberPipe,
    JoinRoomComponent,
    TotalMedalsNumberPipe,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  loading: boolean = false;
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  toastrHelper = inject(ToastrHelperService);
  localStorageService = inject(LocalStorageService);
  destroyRef = inject(DestroyRef);
  router = inject(Router);
  games = games;
  gameSelected: string = 'general';

  play(): void {
    this.loading = true;

    const roomCode = this.roomService.generateRoomCode();

    const newRoom = {
      gameName: roomCode,
      playerIds: [this.playerService.currentPlayerSig()?.userId!],
      isStarted: false,
      startDate: null,
      startAgainNumber: 0,
      isCreatedByAdmin: false,
      isReadyNotificationActivated: false,
      roomCode: roomCode,
    };

    this.roomService
      .deleteUserRooms()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.roomService.addRoom(newRoom as Room)),
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
            this.toastrHelper.error(error.message);
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
          this.toastrHelper.error('Aucune room trouvée avec ce code');
        }
      });
  }
}
