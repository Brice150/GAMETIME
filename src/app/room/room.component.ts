import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  filter,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { Player } from '../core/interfaces/player';
import { PlayerRoom } from '../core/interfaces/player-room';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';
import { RoomHeaderComponent } from './room-header/room-header.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-room',
  imports: [
    CommonModule,
    WordGamesComponent,
    WaitingRoomComponent,
    RoomHeaderComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastr = inject(ToastrService);
  activatedRoute = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  room: Room = {} as Room;
  player: Player = {} as Player;
  playerRoom: PlayerRoom = {} as PlayerRoom;
  currentUserId?: string;
  @ViewChild(WordGamesComponent) wordGamesComponent!: WordGamesComponent;

  ngOnInit(): void {
    this.loading = true;

    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params): Observable<string> => {
          return this.playerService.getPlayers().pipe(
            take(1),
            map((players: Player[]) => {
              if (!players?.length) throw new Error('Aucun joueur trouvé');
              this.player = players[0];
              this.currentUserId = this.player.userId;
              return params['id'];
            })
          );
        }),
        switchMap((roomId: string) => this.roomService.getRoom(roomId)),
        switchMap((room: Room | null) => {
          if (!room) {
            this.toastr.info('Room supprimée', 'Room', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom info',
            });
            return of(null);
          }

          this.room = room;

          const playerRoom = room.playersRoom.find(
            (p) => p.userId === this.currentUserId
          );

          if (playerRoom) {
            this.playerRoom = playerRoom;
            return of(null);
          }

          if (!room.isSolo) {
            this.playerRoom = {
              userId: this.player.userId!,
              username: this.player.username,
              currentRoomWins: [],
            };
            this.room.playersRoom.push(this.playerRoom);

            return this.roomService.updateRoom(this.room).pipe(
              tap(() => {
                this.toastr.info(
                  'Vous venez de rejoindre une room',
                  'Game Time',
                  {
                    positionClass: 'toast-bottom-center',
                    toastClass: 'ngx-toastr custom info',
                  }
                );
              })
            );
          }

          return of(null);
        })
      )
      .subscribe({
        next: () => {
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

  updateRoom(stepWon: boolean): void {
    if (stepWon) {
      const stat = this.player.stats.find(
        (stat) => stat.gameName === this.room.gameName
      );
      if (stat) {
        stat.medalsNumer += 1;
      }
    }

    const updatePlayer$ = stepWon
      ? this.playerService.updatePlayer(this.player).pipe(
          tap(() => {
            this.toastr.info('Manche gagnée', 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom info',
            });
          })
        )
      : of(undefined).pipe(
          tap(() => {
            this.toastr.error('Manche perdue', 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          })
        );

    updatePlayer$
      .pipe(
        switchMap(() => {
          const playerRoom = this.room.playersRoom.find(
            (player) => player.userId === this.player.userId
          );
          playerRoom?.currentRoomWins.push(stepWon);

          return this.roomService.updateRoom(this.room);
        })
      )
      .subscribe({
        next: () => {
          this.wordGamesComponent?.new();
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  getMedalsNumber(): number {
    const stat = this.player?.stats?.find(
      (stat) => stat.gameName === this.room.gameName
    );
    return stat?.medalsNumer ?? 0;
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
          this.router.navigate(['/']);
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
