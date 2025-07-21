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
import { gameMap } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { PlayerRoom } from '../core/interfaces/player-room';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ResultsComponent } from './results/results.component';
import { RoomHeaderComponent } from './room-header/room-header.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';

@Component({
  selector: 'app-room',
  imports: [
    CommonModule,
    WordGamesComponent,
    WaitingRoomComponent,
    RoomHeaderComponent,
    ResultsComponent,
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
  isNextButtonAvailable = false;
  isSeeResultsAvailable = false;
  isResultPageActive = false;
  drapeauxGameKey = gameMap['drapeaux'].key;
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
            const stat = this.player.stats.find(
              (stat) => stat.gameName === this.room.gameName
            );

            this.playerRoom = {
              userId: this.player.userId!,
              username: this.player.username,
              isOver: false,
              finishDate: null,
              medalsNumber: stat?.medalsNumer || 0,
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
          if (this.playerRoom.isOver) {
            this.isResultPageActive = true;
          } else if (
            this.playerRoom.currentRoomWins.length ===
            this.room.responses.length
          ) {
            this.isSeeResultsAvailable = true;
          } else {
            this.isResultPageActive = false;
          }
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
            this.toastr.info(
              'Manche gagnée',
              this.room.gameName.charAt(0).toUpperCase() +
                this.room.gameName.slice(1),
              {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom info',
              }
            );
          })
        )
      : of(undefined).pipe(
          tap(() => {
            this.toastr.error(
              'Manche perdue',
              this.room.gameName.charAt(0).toUpperCase() +
                this.room.gameName.slice(1),
              {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              }
            );
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
          if (
            this.room.responses.length !==
            this.playerRoom.currentRoomWins.length
          ) {
            this.isNextButtonAvailable = true;
          } else {
            this.isSeeResultsAvailable = true;
          }
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            if (error.message.includes('No document to update')) {
              this.router.navigate(['/']);
              this.toastr.error(
                "La room a été supprimée par l'hôte",
                'Game Time',
                {
                  positionClass: 'toast-bottom-center',
                  toastClass: 'ngx-toastr custom error',
                }
              );
            } else {
              this.toastr.error(error.message, 'Game Time', {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              });
            }
          }
        },
      });
  }

  openDialog(): void {
    if (this.currentUserId === this.room.userId) {
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
            this.toastr.info('La room a été supprimée', 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom info',
            });
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (
              !error.message.includes('Missing or insufficient permissions.')
            ) {
              this.toastr.error(error.message, 'Game Time', {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              });
            }
          },
        });
    } else {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: 'quitter cette room',
      });

      dialogRef
        .afterClosed()
        .pipe(
          filter((res: boolean) => res),
          switchMap(() => {
            this.loading = true;

            this.room.playersRoom = this.room.playersRoom.filter(
              (player) => player.userId !== this.player.userId
            );

            return this.roomService.updateRoom(this.room);
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
            if (
              !error.message.includes('Missing or insufficient permissions.')
            ) {
              if (error.message.includes('No document to update')) {
                this.router.navigate(['/']);
                this.toastr.info(
                  'Vous venez de quitter une room',
                  'Game Time',
                  {
                    positionClass: 'toast-bottom-center',
                    toastClass: 'ngx-toastr custom info',
                  }
                );
              } else {
                this.toastr.error(error.message, 'Game Time', {
                  positionClass: 'toast-bottom-center',
                  toastClass: 'ngx-toastr custom error',
                });
              }
            }
          },
        });
    }
  }

  next(): void {
    this.wordGamesComponent?.new();
    this.isNextButtonAvailable = false;
  }

  seeResults(): void {
    this.loading = true;

    const playerRoom = this.room.playersRoom.find(
      (player) => player.userId === this.player.userId
    );

    if (playerRoom) {
      playerRoom.isOver = true;
      playerRoom.finishDate = new Date();

      const stat = this.player.stats.find(
        (stat) => stat.gameName === this.room.gameName
      );

      playerRoom.medalsNumber = stat?.medalsNumer || 0;
    }

    this.updateRoomAndHandleResponse(() => {
      this.isSeeResultsAvailable = false;
      this.isResultPageActive = true;
    });
  }

  start(): void {
    this.loading = true;

    this.room.isStarted = true;
    this.room.startDate = new Date();

    this.updateRoomAndHandleResponse(() => {
      this.isResultPageActive = false;
    });
  }

  startAgain(): void {
    this.loading = true;

    this.room.countries = [];
    this.room.responses = [];
    this.room.startDate = new Date();
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
      this.isResultPageActive = false;
    });
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

  updateRoomAndHandleResponse(onSuccess: () => void): void {
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
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  isEveryoneDone(): boolean {
    return this.room.playersRoom.every((playerRoom) => playerRoom.isOver);
  }
}
