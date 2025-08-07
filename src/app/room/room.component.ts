import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { filter, forkJoin, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { gameMap } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomForm } from '../core/interfaces/room-form';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { AddRoomDialogComponent } from '../shared/components/add-room-dialog/add-room-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ResultsComponent } from './results/results.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';

@Component({
  selector: 'app-room',
  imports: [
    CommonModule,
    WordGamesComponent,
    WaitingRoomComponent,
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
  localStorageService = inject(LocalStorageService);
  dialog = inject(MatDialog);
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  room: Room = {} as Room;
  players: Player[] = [];
  isNextButtonAvailable = false;
  isSeeResultsAvailable = false;
  isResultPageActive = false;
  drapeauxGameKey = gameMap['drapeaux'].key;
  @ViewChild(WordGamesComponent) wordGamesComponent!: WordGamesComponent;

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params) => this.roomService.getRoom(params['id'])),
        switchMap((room: Room | null) => {
          if (!room) {
            return of(null);
          }

          this.room = room;

          if (
            this.room.playerIds.includes(
              this.playerService.currentPlayerSig()!.userId!
            )
          ) {
            return of(room);
          }

          if (
            !(
              room.isCreatedByAdmin &&
              this.playerService.currentPlayerSig()!.isAdmin
            )
          ) {
            this.room.playerIds.push(
              this.playerService.currentPlayerSig()!.userId!
            );

            this.roomService
              .updateRoom(this.room)
              .pipe(takeUntil(this.destroyed$))
              .subscribe({
                next: () => {
                  this.loading = false;
                },
                error: (error: HttpErrorResponse) => {
                  this.loading = false;
                  if (
                    !error.message.includes(
                      'Missing or insufficient permissions.'
                    )
                  ) {
                    this.toastr.error(error.message, 'Game Time', {
                      positionClass: 'toast-bottom-center',
                      toastClass: 'ngx-toastr custom error',
                    });
                  }
                },
              });
            return of(room);
          } else if (
            room.isCreatedByAdmin &&
            this.playerService.currentPlayerSig()!.isAdmin
          ) {
            this.router.navigate(['/admin', room.id]);
          }

          return of(room);
        }),
        switchMap((room) => {
          if (!room || !room.playerIds?.length) {
            return of([]);
          }
          return this.playerService.getPlayers(room.playerIds);
        })
      )
      .subscribe({
        next: (players) => {
          if (!this.room.isStarted) {
            this.players = players;
          } else {
            this.players = players.sort((a, b) => {
              const aTrueCount = a.currentRoomWins.filter(Boolean).length;
              const bTrueCount = b.currentRoomWins.filter(Boolean).length;

              if (bTrueCount !== aTrueCount) {
                return bTrueCount - aTrueCount;
              }

              const aFinish = a.finishDate
                ? this.toJsDate(a.finishDate).getTime()
                : Infinity;
              const bFinish = b.finishDate
                ? this.toJsDate(b.finishDate).getTime()
                : Infinity;

              return aFinish - bFinish;
            });
          }
          if (this.playerService.currentPlayerSig()!.isOver) {
            this.isResultPageActive = true;
          } else if (
            this.playerService.currentPlayerSig()!.currentRoomWins.length ===
            this.room.responses.length
          ) {
            this.isSeeResultsAvailable = true;
          } else {
            this.isResultPageActive = false;
          }
          this.roomService.currentRoomSig.set(this.room);
          this.playerService.currentPlayersSig.set(this.players);
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

  toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  updatePlayerGame(stepWon: boolean): void {
    if (stepWon) {
      const stat = this.playerService
        .currentPlayerSig()!
        .stats.find((stat) => stat.gameName === this.room.gameName);
      if (stat) {
        stat.medalsNumer += 1;
      }
    }

    this.playerService.currentPlayerSig()!.currentRoomWins.push(stepWon);

    this.playerService
      .updatePlayer(this.playerService.currentPlayerSig()!)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.handlePlayerNextAction(stepWon);
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

  handlePlayerNextAction(stepWon: boolean): void {
    if (stepWon) {
      this.toastr.info(
        'Manche gagnée',
        this.room.gameName.charAt(0).toUpperCase() +
          this.room.gameName.slice(1),
        {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom info',
        }
      );
    } else {
      this.toastr.error(
        'Manche perdue',
        this.room.gameName.charAt(0).toUpperCase() +
          this.room.gameName.slice(1),
        {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom error',
        }
      );
    }

    if (
      this.room.responses.length !==
      this.playerService.currentPlayerSig()!.currentRoomWins.length
    ) {
      this.isNextButtonAvailable = true;
    } else {
      this.isSeeResultsAvailable = true;
    }
    this.playerService.currentPlayerSig.set(
      this.playerService.currentPlayerSig()!
    );
  }

  openDialog(): void {
    if (this.playerService.currentPlayerSig()!.userId === this.room.userId) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: 'supprimer cette room',
      });

      dialogRef
        .afterClosed()
        .pipe(
          filter((res: boolean) => res),
          switchMap(() => {
            this.loading = true;
            this.players.forEach((player) => {
              player.currentRoomWins = [];
              player.isOver = false;
              player.finishDate = null;
            });
            return this.playerService.updatePlayers(this.players);
          }),
          takeUntil(this.destroyed$),
          switchMap(() => this.roomService.deleteRoom(this.room.id!))
        )
        .subscribe({
          next: () => {
            this.roomService.currentRoomSig.set(undefined);
            this.playerService.currentPlayersSig.set([]);
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
            this.room.playerIds = this.room.playerIds.filter(
              (playerId) =>
                playerId !== this.playerService.currentPlayerSig()!.userId
            );

            //FIXME
            return this.roomService.updateRoom(this.room);
          }),
          takeUntil(this.destroyed$),
          switchMap(() => {
            this.loading = true;
            this.playerService.currentPlayerSig()!.currentRoomWins = [];
            this.playerService.currentPlayerSig()!.isOver = false;
            this.playerService.currentPlayerSig()!.finishDate = null;
            return this.playerService.updatePlayer(
              this.playerService.currentPlayerSig()!
            );
          })
        )
        .subscribe({
          next: () => {
            this.roomService.currentRoomSig.set(undefined);
            this.playerService.currentPlayersSig.set([]);
            this.loading = false;
            this.router.navigate(['/']);
            this.toastr.info('Vous venez de quitter une room', 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom info',
            });
            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (error.message.includes('No document to update')) {
              this.router.navigate(['/']);
              this.toastr.info('Vous venez de quitter une room', 'Game Time', {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom info',
              });
            } else {
              this.toastr.error(error.message, 'Game Time', {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              });
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
    this.playerService.currentPlayerSig()!.isOver = true;
    this.playerService.currentPlayerSig()!.finishDate = new Date();

    this.playerService
      .updatePlayer(this.playerService.currentPlayerSig()!)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.isSeeResultsAvailable = false;
          this.isResultPageActive = true;
          this.playerService.currentPlayerSig.set(
            this.playerService.currentPlayerSig()!
          );
          this.loading = false;
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

  start(): void {
    this.loading = true;

    this.room.countries = [];
    this.room.responses = [];
    this.room.startDate = new Date();
    this.room.startAgainNumber += 1;
    this.room.isStarted = true;

    this.roomService.generateResponses(
      this.room.gameName,
      this.room.stepsNumber,
      this.room.continentFilter,
      this.room.isWordLengthIncreasing,
      this.room.startWordLength,
      this.room.countries,
      this.room.responses
    );

    this.roomService
      .updateRoom(this.room)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          this.players.forEach((player) => {
            player.isOver = false;
            player.finishDate = null;
            player.currentRoomWins = [];
          });
          return this.playerService.updatePlayers(this.players);
        })
      )
      .subscribe({
        next: () => {
          this.localStorageService.newGame(
            this.room.id!,
            this.room.startAgainNumber
          );
          this.isResultPageActive = false;
          this.roomService.currentRoomSig.set(this.room);
          this.playerService.currentPlayersSig.set(this.players);
          this.playerService.currentPlayerSig.set(
            this.players.filter(
              (player) =>
                player.userId === this.playerService.currentPlayerSig()!.userId
            )[0]
          );

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

  share(): void {
    const link = window.location.href;

    navigator.clipboard.writeText(link).then(() => {
      this.toastr.info(
        'Lien de la partie copié, envoyez ce lien à vos amis pour jouer en multijoueur !',
        'Game Time',
        {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom info',
        }
      );
    });
  }

  shouldShowPlayButton(): boolean {
    const userId = this.playerService.currentPlayerSig()?.userId;
    return (
      (this.isResultPageActive && userId === this.room.userId) ||
      (!this.room.isStarted && userId === this.room.userId)
    );
  }

  openDialogs(): void {
    if (
      this.room.isStarted &&
      this.players.some((player) => !player.isOver || !player.finishDate)
    ) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: "rejouer alors que tous les joueurs n'ont pas encore terminé",
      });

      dialogRef
        .afterClosed()
        .pipe(filter((res: boolean) => res))
        .subscribe(() => this.openAddRoomDialog());
      return;
    }

    this.openAddRoomDialog();
  }

  openAddRoomDialog(): void {
    const dialogRef = this.dialog.open(AddRoomDialogComponent, {
      data: 'startAgain',
    });

    dialogRef
      .afterClosed()
      .pipe(filter((roomData: RoomForm) => !!roomData))
      .subscribe({
        next: (roomData: RoomForm) => {
          if (roomData && roomData.gameSelected) {
            this.room.gameName = roomData.gameSelected;
            if (roomData.gameSelected === 'motus') {
              this.room.showFirstLetter = roomData.showFirstLetterMotus;
            } else if (roomData.gameSelected === 'drapeaux') {
              this.room.showFirstLetter = roomData.showFirstLetterDrapeaux;
            }
            this.room.stepsNumber = roomData.stepsNumber;
            this.room.continentFilter = roomData.continentFilter;
            this.room.isWordLengthIncreasing = roomData.isWordLengthIncreasing;
            this.room.startWordLength = roomData.startWordLength;
          }

          this.start();
        },
      });
  }
}
