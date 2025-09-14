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
  takeUntil,
} from 'rxjs';
import { gameMap } from 'src/assets/data/games';
import { goals } from 'src/assets/data/goals';
import { ExcludedUserQuestions } from '../core/interfaces/excluded-user-questions';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomForm } from '../core/interfaces/room-form';
import { AiService } from '../core/services/ai.service';
import { ExcludedQuestionsService } from '../core/services/excluded-questions.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { AddRoomDialogComponent } from '../shared/components/add-room-dialog/add-room-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MultiplayerDialogComponent } from '../shared/components/multiplayer-dialog/multiplayer-dialog.component';
import { DifficultyPipe } from '../shared/pipes/difficulty.pipe';
import { QuizCategoryPipe } from '../shared/pipes/quiz-category.pipe';
import { AiGamesComponent } from './ai-games/ai-games.component';
import { ResultsComponent } from './results/results.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';

@Component({
  selector: 'app-room',
  imports: [
    CommonModule,
    WordGamesComponent,
    AiGamesComponent,
    WaitingRoomComponent,
    ResultsComponent,
    MatProgressSpinnerModule,
    DifficultyPipe,
    QuizCategoryPipe,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  excludedQuestionsService = inject(ExcludedQuestionsService);
  router = inject(Router);
  toastr = inject(ToastrService);
  activatedRoute = inject(ActivatedRoute);
  localStorageService = inject(LocalStorageService);
  aiService = inject(AiService);
  dialog = inject(MatDialog);
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  room: Room = {} as Room;
  players: Player[] = [];
  isNextButtonAvailable = false;
  isSeeResultsAvailable = false;
  isResultPageActive = false;
  userLeft = false;
  userKickedOut = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  goals = goals;
  excludedUserQuestions: ExcludedUserQuestions = {} as ExcludedUserQuestions;
  @ViewChild(WordGamesComponent) wordGamesComponent!: WordGamesComponent;
  @ViewChild(AiGamesComponent) aiGamesComponent!: AiGamesComponent;

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params) =>
          this.roomService
            .getRoom(params['id'])
            .pipe(takeUntil(this.destroyed$))
        ),
        switchMap((room: Room | null) => {
          if (!room) {
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/']);
            if (!this.userLeft) {
              this.toastr.info("L'hôte a supprimé la room", 'Game Time', {
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom info',
              });
            }
            return of(null);
          }

          if (
            this.room.playerIds &&
            room.playerIds &&
            this.playerService.currentPlayerSig()?.userId &&
            this.room.playerIds.includes(
              this.playerService.currentPlayerSig()?.userId!
            ) &&
            !room.playerIds.includes(
              this.playerService.currentPlayerSig()?.userId!
            )
          ) {
            this.userKickedOut = true;
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/']);
            this.toastr.info('Vous avez été exclu de la room', 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom info',
            });
          }

          this.room = room;

          if (
            this.room.isReadyNotificationActivated &&
            !this.playerService.currentPlayerSig()?.isReady &&
            this.playerService.currentPlayerSig()?.userId !==
              this.room.userId &&
            (this.playerService.currentPlayerSig()?.finishDate ||
              !this.room.isStarted)
          ) {
            this.toastr.info(
              "L'hôte veut lancer la room, cliquez sur prêt",
              'Game Time',
              {
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom info',
              }
            );
          }

          if (
            this.playerService.currentPlayerSig()?.userId &&
            this.room.playerIds.includes(
              this.playerService.currentPlayerSig()?.userId!
            )
          ) {
            return of(this.room);
          }

          if (
            !(
              this.room.isCreatedByAdmin &&
              this.playerService.currentPlayerSig() &&
              this.playerService.currentPlayerSig()?.isAdmin
            ) &&
            !this.userLeft &&
            !this.userKickedOut
          ) {
            this.localStorageService.newGame(this.room.id!);
            this.room.playerIds.push(
              this.playerService.currentPlayerSig()?.userId!
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
                      positionClass: 'toast-top-center',
                      toastClass: 'ngx-toastr custom error',
                    });
                  }
                },
              });
            return of(this.room);
          } else if (
            this.room.isCreatedByAdmin &&
            this.playerService.currentPlayerSig()?.isAdmin
          ) {
            this.router.navigate(['/admin', this.room.id]);
          }

          return of(this.room);
        }),
        switchMap((room) => {
          if (!room || !room.playerIds?.length) {
            return of([]);
          }
          return this.playerService
            .getPlayers(room.playerIds)
            .pipe(takeUntil(this.destroyed$));
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
          if (this.playerService.currentPlayerSig()?.isOver) {
            this.isResultPageActive = true;
          } else if (
            this.playerService.currentPlayerSig()?.currentRoomWins?.length ===
              this.room.responses?.length &&
            !this.room.isLoading
          ) {
            this.isSeeResultsAvailable = true;
          } else {
            this.isResultPageActive = false;
          }
          this.roomService.currentRoomSig.set(this.room);
          this.playerService.currentPlayersSig.set(this.players);
          this.loading = this.room.isLoading ?? false;
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

    this.excludedQuestionsService
      .getExcludedQuestions()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (excludedUserQuestions) => {
          this.excludedUserQuestions = excludedUserQuestions[0];
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
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
    if (!this.playerService.currentPlayerSig()) {
      return;
    }

    if (stepWon) {
      const stat = this.playerService
        .currentPlayerSig()!
        .stats.find((stat) => stat.gameName === this.room.gameName);
      if (stat) {
        stat.medalsNumber += 1;

        const goal = goals.find((goal) => goal.target === stat.medalsNumber);
        if (goal) {
          stat.medalsNumber += goal.reward;
          this.toastr.info(
            'Vous avez obtenu le succès : ' + goal.label,
            this.room.gameName.charAt(0).toUpperCase() +
              this.room.gameName.slice(1),
            {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom info',
            }
          );
        }
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
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  handlePlayerNextAction(stepWon: boolean): void {
    if (this.room.gameName !== this.quizGameKey) {
      if (stepWon) {
        this.toastr.info(
          'Manche gagnée',
          this.room.gameName.charAt(0).toUpperCase() +
            this.room.gameName.slice(1),
          {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          }
        );
      } else {
        this.toastr.error(
          'Manche perdue',
          this.room.gameName.charAt(0).toUpperCase() +
            this.room.gameName.slice(1),
          {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          }
        );
      }
    }

    if (
      this.room.responses.length !==
      this.playerService.currentPlayerSig()?.currentRoomWins.length
    ) {
      this.isNextButtonAvailable = true;
    } else {
      this.isSeeResultsAvailable = true;
    }
    this.playerService.currentPlayerSig.set(
      this.playerService.currentPlayerSig()
    );
  }

  openDialog(): void {
    if (this.playerService.currentPlayerSig()?.userId === this.room.userId) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: 'supprimer cette room',
      });

      dialogRef
        .afterClosed()
        .pipe(
          filter((res: boolean) => res),
          switchMap(() => {
            this.loading = true;
            this.userLeft = true;

            this.players.forEach((player) => {
              player.currentRoomWins = [];
              player.isOver = false;
              player.finishDate = null;
              player.isReady = false;
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
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/']);
            this.toastr.info('La room a été supprimée', 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom info',
            });
            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (
              !error.message.includes('Missing or insufficient permissions.')
            ) {
              this.toastr.error(error.message, 'Game Time', {
                positionClass: 'toast-top-center',
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
            this.userLeft = true;

            this.room.playerIds = this.room.playerIds.filter(
              (playerId) =>
                playerId !== this.playerService.currentPlayerSig()?.userId
            );

            return this.roomService.updateRoom(this.room);
          }),
          takeUntil(this.destroyed$),
          switchMap(() => {
            if (!this.playerService.currentPlayerSig()) {
              return of(undefined);
            }

            this.playerService.currentPlayerSig()!.currentRoomWins = [];
            this.playerService.currentPlayerSig()!.isOver = false;
            this.playerService.currentPlayerSig()!.finishDate = null;
            this.playerService.currentPlayerSig()!.isReady = false;

            return this.playerService.updatePlayer(
              this.playerService.currentPlayerSig()!
            );
          })
        )
        .subscribe({
          next: () => {
            this.roomService.currentRoomSig.set(undefined);
            this.playerService.currentPlayersSig.set([]);
            this.playerService.currentPlayerSig.set(
              this.playerService.currentPlayerSig()
            );
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/']);
            this.toastr.info('Vous venez de quitter une room', 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom info',
            });
            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (error.message.includes('No document to update')) {
              this.router.navigate(['/']);
              this.toastr.info('Vous venez de quitter une room', 'Game Time', {
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom info',
              });
            } else {
              this.toastr.error(error.message, 'Game Time', {
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom error',
              });
            }
          },
        });
    }
  }

  next(): void {
    if (this.room.gameName === this.quizGameKey) {
      this.aiGamesComponent?.new();
    } else {
      this.wordGamesComponent?.new();
    }
    this.isNextButtonAvailable = false;
  }

  seeResults(): void {
    if (!this.playerService.currentPlayerSig()) {
      return;
    }

    this.loading = true;
    this.playerService.currentPlayerSig()!.isOver = true;
    this.playerService.currentPlayerSig()!.finishDate = new Date();
    this.playerService.currentPlayerSig()!.isReady = false;

    this.playerService
      .updatePlayer(this.playerService.currentPlayerSig()!)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.isSeeResultsAvailable = false;
          this.isResultPageActive = true;
          this.playerService.currentPlayerSig.set(
            this.playerService.currentPlayerSig()
          );
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  start(): void {
    this.loading = true;

    this.room.countries = [];
    this.room.brands = [];
    this.room.questions = [];
    this.room.responses = [];
    this.room.isReadyNotificationActivated = false;
    this.room.isLoading = true;

    this.roomService
      .updateRoom(this.room)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          this.players.forEach((player) => {
            player.isOver = false;
            player.finishDate = null;
            player.isReady = false;
            player.currentRoomWins = [];
          });
          return this.playerService.updatePlayers(this.players);
        }),
        switchMap(() => {
          this.room.startDate = new Date();
          this.room.startAgainNumber += 1;
          this.room.isStarted = true;
          return this.generateQuestions();
        }),
        switchMap((room) => {
          this.room = room;
          this.room.isLoading = false;
          return this.roomService.updateRoom(this.room);
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
            this.players.find(
              (player) =>
                player.userId === this.playerService.currentPlayerSig()?.userId
            )!
          );

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.resetRoom();
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  generateQuestions(): Observable<Room> {
    if (this.room.gameName === this.quizGameKey) {
      return this.aiService
        .generate(this.room, this.excludedUserQuestions)
        .pipe(
          switchMap((response) => {
            const aiResponse = this.aiService.getAiResponse(response);
            this.room.questions = aiResponse.questions;
            this.room.responses = aiResponse.responses;

            const descriptions = this.room.questions.map((q) => q.description);
            return this.excludedQuestionsService
              .addOrUpdateExcludedQuestions(descriptions)
              .pipe(map(() => this.room));
          })
        );
    }

    this.roomService.generateResponses(
      this.room.gameName,
      this.room.stepsNumber,
      this.room.categoryFilter,
      this.room.isWordLengthIncreasing,
      this.room.startWordLength,
      this.room.countries,
      this.room.brands,
      this.room.responses
    );

    return of(this.room);
  }

  resetRoom(): void {
    this.room.isStarted = false;
    this.room.startDate = null;
    this.room.isReadyNotificationActivated = false;
    this.room.isLoading = false;

    this.roomService
      .updateRoom(this.room)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
      });
  }

  multiplayer(): void {
    this.dialog.open(MultiplayerDialogComponent, {
      data: this.room.roomCode,
    });
  }

  shouldShowPlayButton(): boolean {
    const userId = this.playerService.currentPlayerSig()?.userId;
    return (
      (this.isResultPageActive && userId === this.room.userId) ||
      (!this.room.isStarted && userId === this.room.userId)
    );
  }

  shouldShowReadyButton(): boolean {
    const userId = this.playerService.currentPlayerSig()?.userId;
    return (
      (this.isResultPageActive && userId !== this.room.userId) ||
      (!this.room.isStarted && userId !== this.room.userId)
    );
  }

  ready(): void {
    this.playerService.currentPlayerSig()!.isReady =
      !this.playerService.currentPlayerSig()!.isReady;

    this.playerService
      .updatePlayer(this.playerService.currentPlayerSig()!)
      .subscribe(() =>
        this.playerService.currentPlayerSig.set(
          this.playerService.currentPlayerSig()
        )
      );
  }

  openDialogs(): void {
    if (
      this.players.some(
        (player) =>
          player.userId !== this.playerService.currentPlayerSig()?.userId &&
          !player.isReady
      )
    ) {
      this.room.isReadyNotificationActivated =
        !this.room.isReadyNotificationActivated;
      this.roomService
        .updateRoom(this.room)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() =>
          this.toastr.error('Tous les joueurs ne sont pas prêts', 'Game Time', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          })
        );
      return;
    }

    this.openAddRoomDialog();
  }

  openAddRoomDialog(): void {
    const dialogRef = this.dialog.open(AddRoomDialogComponent, {
      data: this.room.startDate ? 'startAgain' : '',
    });

    dialogRef
      .afterClosed()
      .pipe(filter((roomData: RoomForm) => !!roomData))
      .subscribe({
        next: (roomData: RoomForm) => {
          if (roomData && roomData.gameSelected) {
            this.room.gameName = roomData.gameSelected;
            if (roomData.gameSelected === this.motusGameKey) {
              this.room.showFirstLetter = roomData.showFirstLetterMotus;
            } else if (roomData.gameSelected === this.drapeauxGameKey) {
              this.room.showFirstLetter = roomData.showFirstLetterDrapeaux;
            } else if (roomData.gameSelected === this.marquesGameKey) {
              this.room.showFirstLetter = roomData.showFirstLetterMarques;
            }
            this.room.stepsNumber = roomData.stepsNumber;
            this.room.difficultyFilter = roomData.difficultyFilter;
            this.room.categoryFilter = roomData.categoryFilter;
            this.room.isWordLengthIncreasing = roomData.isWordLengthIncreasing;
            this.room.startWordLength = roomData.startWordLength;
          }

          this.start();
        },
      });
  }

  removePlayer(userId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer le joueur de la room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.room.playerIds = this.room.playerIds.filter(
            (playerId) => playerId !== userId
          );
          return this.roomService.updateRoom(this.room);
        })
      )
      .subscribe();
  }
}
