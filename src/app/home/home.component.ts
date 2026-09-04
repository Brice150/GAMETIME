import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { switchMap, take } from 'rxjs';
import { gamesByCategory } from '../../assets/data/games';
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
    MedalsNumberPipe,
    JoinRoomComponent,
    TotalMedalsNumberPipe,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly loading = signal(false);
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  toastrHelper = inject(ToastrHelperService);
  localStorageService = inject(LocalStorageService);
  destroyRef = inject(DestroyRef);
  router = inject(Router);
  gameGroups = gamesByCategory();

  play(): void {
    this.loading.set(true);
    const currentUserId = this.playerService.currentPlayerSig()?.userId;

    if (!currentUserId) {
      this.loading.set(false);
      this.toastrHelper.error('Utilisateur introuvable');
      return;
    }

    this.roomService
      .deleteUserRooms()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.roomService.generateUniqueRoomCode()),
        switchMap((roomCode) =>
          this.roomService.addRoom({
            // Le jeu est choisi dans la room : vide tant qu il ne l est pas.
            gameName: '',
            playerIds: [currentUserId],
            isStarted: false,
            startDate: null,
            startAgainNumber: 0,
            roomCode,
          } as Room),
        ),
      )
      .subscribe({
        next: (roomId) => {
          this.localStorageService.newGame(roomId);
          this.loading.set(false);
          this.router.navigate([`/room/${roomId}`]);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  joinRoom(roomCode: string): void {
    this.loading.set(true);

    this.roomService
      .getRoomsByCode(roomCode)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rooms) => {
          this.loading.set(false);

          if (rooms && rooms.length > 0) {
            const room = rooms[0];
            this.localStorageService.newGame(room.id!);

            // Rejoindre une partie lancee fait commencer a la manche 1 pendant
            // que les autres ont de l avance : autant le dire.
            if (room.isStarted) {
              this.toastrHelper.info(
                'La partie est déjà en cours, vous la rejoignez en route',
                'Room',
              );
            }

            this.router.navigate([`/room/${room.id!}`]);
          } else {
            this.toastrHelper.error('Aucune room trouvée avec ce code');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }
}
