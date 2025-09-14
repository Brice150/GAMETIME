import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { filter, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { map, retry } from 'rxjs/operators';
import { gameMap } from 'src/assets/data/games';
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
import { CustomDatePipe } from '../shared/pipes/custom-date.pipe';
import { DurationBetweenDatesPipe } from '../shared/pipes/duration.pipe';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-admin-room',
  imports: [
    CommonModule,
    DurationBetweenDatesPipe,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
    MedalsNumberPipe,
    CustomDatePipe,
  ],
  templateUrl: './admin-room.component.html',
  styleUrl: './admin-room.component.css',
  providers: [DatePipe],
})
export class AdminRoomComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  room: Room = {} as Room;
  players: Player[] = [];
  roomService = inject(RoomService);
  activatedRoute = inject(ActivatedRoute);
  playerService = inject(PlayerService);
  excludedQuestionsService = inject(ExcludedQuestionsService);
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  aiService = inject(AiService);
  dialog = inject(MatDialog);
  router = inject(Router);
  destroyed$ = new Subject<void>();
  hideResults = true;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  excludedUserQuestions: ExcludedUserQuestions = {} as ExcludedUserQuestions;

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params) =>
          this.roomService
            .getRoom(params['id'])
            .pipe(takeUntil(this.destroyed$))
        ),
        switchMap((room) => {
          this.room = room;
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }

  multiplayer(): void {
    this.dialog.open(MultiplayerDialogComponent, {
      data: this.room.roomCode,
    });
  }

  start(): void {
    if (this.players.length === 0) {
      this.toastr.error(
        'Pour être lancée, une room doit avoir des joueurs',
        'Admin',
        {
          positionClass: 'toast-top-center',
          toastClass: 'ngx-toastr custom error',
        }
      );
      return;
    }

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

  stop(): void {
    this.loading = true;

    this.players.forEach((player) => {
      player.isOver = true;
      for (let i = 0; i < this.room.responses.length; i++) {
        if (player.currentRoomWins[i] === undefined) {
          player.currentRoomWins.push(false);
        }
      }
    });

    this.playerService
      .updatePlayers(this.players)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.loading = false;
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

  allPlayersDone(): boolean {
    return this.players.every((player) => player.isOver);
  }

  openAddRoomDialog(): void {
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

  joinRoom(): void {
    this.router.navigate(['/room', this.room.id]);
  }
}
