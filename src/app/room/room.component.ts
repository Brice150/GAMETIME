import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timestamp } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  timer,
} from 'rxjs';
import { gameMap } from '../../assets/data/games';
import { goals } from '../../assets/data/goals';

import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomForm } from '../core/interfaces/room-form';

import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { AddRoomDialogComponent } from '../shared/components/add-room-dialog/add-room-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MultiplayerDialogComponent } from '../shared/components/multiplayer-dialog/multiplayer-dialog.component';

import { ResultsBoardComponent } from './results-board/results-board.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';

@Component({
  selector: 'app-room',
  imports: [
    CommonModule,
    WordGamesComponent,
    WaitingRoomComponent,
    ResultsBoardComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  activatedRoute = inject(ActivatedRoute);
  localStorageService = inject(LocalStorageService);
  dialog = inject(MatDialog);
  destroyRef = inject(DestroyRef);
  loading = true;
  room: Room = {} as Room;
  players: Player[] = [];
  isNextButtonAvailable = false;
  isResultPageActive = false;
  userLeft = false;
  userKickedOut = false;
  isFinishing = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  goals = goals;
  @ViewChild(WordGamesComponent) wordGamesComponent!: WordGamesComponent;

  ngOnInit(): void {
    const room$ = this.activatedRoute.params.pipe(
      switchMap((params) => this.roomService.getRoom(params['id'])),
      map((room: Room | null) => this.handleRoom(room)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Sans ce filtre, chaque ecriture sur la room recree l'ecoute des joueurs.
    const players$ = room$.pipe(
      map((room) => room?.playerIds ?? []),
      distinctUntilChanged(
        (previous, current) =>
          previous.length === current.length &&
          previous.every((playerId, index) => playerId === current[index]),
      ),
      switchMap((playerIds) =>
        playerIds.length ? this.playerService.getPlayers(playerIds) : of([]),
      ),
    );

    combineLatest([room$, players$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([, players]) => this.handlePlayers(players),
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  handleRoom(room: Room | null): Room | null {
    if (!room) {
      this.localStorageService.clearLocalStorage();
      this.router.navigate(['/accueil']);
      if (!this.userLeft) {
        this.toastrHelper.error("L'hôte a supprimé la room");
      }
      return null;
    }

    const currentPlayer = this.playerService.currentPlayerSig();
    const currentUserId = currentPlayer?.userId;

    if (
      this.room.playerIds &&
      room.playerIds &&
      currentUserId &&
      this.room.playerIds.includes(currentUserId) &&
      !room.playerIds.includes(currentUserId)
    ) {
      this.userKickedOut = true;
      this.localStorageService.clearLocalStorage();
      this.router.navigate(['/accueil']);
      this.toastrHelper.error('Vous avez été exclu de la room');
    }

    const start1 =
      this.room.startDate instanceof Timestamp
        ? this.room.startDate.toDate()
        : this.room.startDate;
    const start2 =
      room.startDate instanceof Timestamp
        ? room.startDate.toDate()
        : room.startDate;

    if (start1?.getTime() !== start2?.getTime()) {
      this.isResultPageActive = false;
    }

    this.room = room;

    if (!this.room.isStarted) {
      this.roomService.preloadGameData(this.room.gameName);
    }

    if (
      this.room.isReadyNotificationActivated &&
      !currentPlayer?.isReady &&
      currentUserId !== this.room.userId &&
      !this.room.isStarted
    ) {
      this.toastrHelper.info(
        "L'hôte veut lancer la room, cliquez sur prêt",
        'Room',
      );
    }

    if (currentUserId && this.room.playerIds.includes(currentUserId)) {
      return this.room;
    }

    if (
      !(this.room.isCreatedByAdmin && currentPlayer && currentPlayer.isAdmin) &&
      !this.userLeft &&
      !this.userKickedOut
    ) {
      if (!currentUserId) {
        return this.room;
      }

      this.localStorageService.newGame(this.room.id!);
      this.room.playerIds.push(currentUserId);

      this.roomService
        .updateRoomFields(this.room.id, { playerIds: this.room.playerIds })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (
              !error.message.includes('Missing or insufficient permissions.')
            ) {
              this.toastrHelper.error(error.message);
            }
          },
        });
      return this.room;
    } else if (this.room.isCreatedByAdmin && currentPlayer?.isAdmin) {
      this.router.navigate(['/admin', this.room.id]);
    }

    return this.room;
  }

  handlePlayers(players: Player[]): void {
    if (!this.room.isStarted) {
      this.players = players;
    } else {
      this.players = players.sort((a, b) => {
        const aTrueCount = a.currentRoomWins.filter(Boolean).length;
        const bTrueCount = b.currentRoomWins.filter(Boolean).length;

        if (bTrueCount !== aTrueCount) {
          return bTrueCount - aTrueCount;
        }

        return (a.durationMs ?? Infinity) - (b.durationMs ?? Infinity);
      });
    }

    const currentPlayer = this.playerService.currentPlayerSig();
    const stepsCount = this.room.responses?.length;
    const allStepsDone =
      !!currentPlayer &&
      !!stepsCount &&
      currentPlayer.currentRoomWins.length === stepsCount;

    if (allStepsDone && !this.room.isLoading) {
      if (!currentPlayer.finishDate) {
        this.seeResults();
      } else if (!this.isFinishing) {
        this.isResultPageActive = true;
      }
    }

    this.roomService.currentRoomSig.set(this.room);
    this.playerService.currentPlayersSig.set(this.players);
    this.loading = this.room.isLoading ?? false;
  }

  updatePlayerGame(stepWon: boolean): void {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer) {
      return;
    }

    if (stepWon) {
      const stat = currentPlayer.stats.find(
        (stat) => stat.gameName === this.room.gameName,
      );
      if (stat) {
        stat.medalsNumber += 1;

        const goal = goals.find((goal) => goal.target === stat.medalsNumber);
        if (goal) {
          this.toastrHelper.info(
            'Vous avez obtenu le succès : Obtenir ' +
              goal.target +
              ' médailles',
            this.room.gameName.charAt(0).toUpperCase() +
              this.room.gameName.slice(1),
          );
        }
      }
    }

    currentPlayer.currentRoomWins.push(stepWon);

    const fields: Partial<Player> = {
      currentRoomWins: currentPlayer.currentRoomWins,
      stats: currentPlayer.stats,
    };

    // Derniere manche : l'arrivee est relevee ici, avant la moindre
    // entree-sortie, et part dans la meme ecriture que la manche.
    const justFinished =
      currentPlayer.currentRoomWins.length === this.room.responses?.length &&
      !currentPlayer.finishDate;

    if (justFinished) {
      this.stampFinish(currentPlayer);
      fields.finishDate = currentPlayer.finishDate;
      fields.durationMs = currentPlayer.durationMs;
      fields.isReady = true;
    }

    this.playerService
      .updatePlayerFields(currentPlayer.id, fields)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handlePlayerNextAction(stepWon);
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });

    if (justFinished) {
      this.showResultsAfterPause();
    }
  }

  stampFinish(player: Player): void {
    player.finishDate = new Date();
    player.durationMs = this.localStorageService.getElapsedMs(
      this.room.id!,
      this.room.startAgainNumber,
    );
    player.isReady = true;
    this.isFinishing = true;
  }

  // Le temps est deja enregistre et publie : ces 3 secondes ne servent qu'a
  // laisser le joueur lire sa derniere manche.
  showResultsAfterPause(): void {
    timer(3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isResultPageActive = true;
        this.playerService.currentPlayerSig.set(
          this.playerService.currentPlayerSig(),
        );
        this.isFinishing = false;
      });
  }

  handlePlayerNextAction(stepWon: boolean): void {
    if (stepWon) {
      this.toastrHelper.info(
        'Manche gagnée',
        this.room.gameName.charAt(0).toUpperCase() +
          this.room.gameName.slice(1),
      );
    } else {
      this.toastrHelper.info(
        'Manche perdue',
        this.room.gameName.charAt(0).toUpperCase() +
          this.room.gameName.slice(1),
      );
    }

    if (
      this.room.responses.length !==
      this.playerService.currentPlayerSig()?.currentRoomWins.length
    ) {
      this.isNextButtonAvailable = true;
    }
    this.playerService.currentPlayerSig.set(
      this.playerService.currentPlayerSig(),
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
              player.finishDate = null;
              player.durationMs = null;
              player.isReady = false;
            });

            return this.playerService.updatePlayers(this.players);
          }),
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => this.roomService.deleteRoom(this.room.id!)),
        )
        .subscribe({
          next: () => {
            this.roomService.currentRoomSig.set(undefined);
            this.playerService.currentPlayersSig.set([]);
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/accueil']);
            this.toastrHelper.info('La room a été supprimée', 'Room');
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (
              !error.message.includes('Missing or insufficient permissions.')
            ) {
              this.toastrHelper.error(error.message);
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
                playerId !== this.playerService.currentPlayerSig()?.userId,
            );

            return this.roomService.updateRoomFields(this.room.id, {
              playerIds: this.room.playerIds,
            });
          }),
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => {
            const currentPlayer = this.playerService.currentPlayerSig();

            if (!currentPlayer) {
              return of(undefined);
            }

            currentPlayer.currentRoomWins = [];
            currentPlayer.finishDate = null;
            currentPlayer.durationMs = null;
            currentPlayer.isReady = false;

            return this.playerService.updatePlayerFields(currentPlayer.id, {
              currentRoomWins: [],
              finishDate: null,
              durationMs: null,
              isReady: false,
            });
          }),
        )
        .subscribe({
          next: () => {
            this.roomService.currentRoomSig.set(undefined);
            this.playerService.currentPlayersSig.set([]);
            this.playerService.currentPlayerSig.set(
              this.playerService.currentPlayerSig(),
            );
            this.localStorageService.clearLocalStorage();
            this.router.navigate(['/accueil']);
            this.toastrHelper.info('Vous venez de quitter une room', 'Room');
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (error.message.includes('No document to update')) {
              this.router.navigate(['/accueil']);
              this.toastrHelper.info('Vous venez de quitter une room', 'Room');
            } else {
              this.toastrHelper.error(error.message);
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
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer || currentPlayer.finishDate) {
      return;
    }

    this.stampFinish(currentPlayer);

    this.playerService
      .updatePlayerFields(currentPlayer.id, {
        finishDate: currentPlayer.finishDate,
        durationMs: currentPlayer.durationMs,
        isReady: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });

    this.showResultsAfterPause();
  }

  start(): void {
    this.loading = true;

    this.room.countries = [];
    this.room.brands = [];
    this.room.responses = [];
    this.room.isReadyNotificationActivated = false;
    this.room.isLoading = true;

    this.roomService
      .updateRoom(this.room)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.players.forEach((player) => {
            player.finishDate = null;
            player.durationMs = null;
            player.isReady = false;
            player.currentRoomWins = [];
          });
          return this.playerService.updatePlayers(this.players);
        }),
        switchMap(() => {
          this.room.startAgainNumber += 1;
          this.room.isStarted = true;
          return this.generateQuestions();
        }),
        switchMap((room) => {
          this.room = room;
          // Apres la generation : le chrono ne compte pas le temps mort du
          // chargement des donnees.
          this.room.startDate = new Date();
          this.room.isLoading = false;
          return this.roomService.updateRoom(this.room);
        }),
      )
      .subscribe({
        next: () => {
          this.localStorageService.newGame(
            this.room.id!,
            this.room.startAgainNumber,
          );
          this.isResultPageActive = false;

          this.roomService.currentRoomSig.set(this.room);
          this.playerService.currentPlayersSig.set(this.players);
          this.playerService.currentPlayerSig.set(
            this.players.find(
              (player) =>
                player.userId === this.playerService.currentPlayerSig()?.userId,
            )!,
          );

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.resetRoom();
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  generateQuestions(): Observable<Room> {
    return from(
      this.roomService.generateResponses(
        this.room.gameName,
        this.room.stepsNumber,
        this.room.categoryFilter,
        this.room.isWordLengthIncreasing,
        this.room.startWordLength,
        this.room.countries,
        this.room.brands,
        this.room.responses,
      ),
    ).pipe(map(() => this.room));
  }

  resetRoom(): void {
    this.room.isStarted = false;
    this.room.startDate = null;
    this.room.isReadyNotificationActivated = false;
    this.room.isLoading = false;

    this.roomService
      .updateRoom(this.room)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    return (
      !this.room.isStarted &&
      this.playerService.currentPlayerSig()?.userId !== this.room.userId
    );
  }

  ready(): void {
    const currentPlayer = this.playerService.currentPlayerSig()!;
    currentPlayer.isReady = !currentPlayer.isReady;

    this.playerService
      .updatePlayerFields(currentPlayer.id, { isReady: currentPlayer.isReady })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.playerService.currentPlayerSig.set(
          this.playerService.currentPlayerSig(),
        ),
      );
  }

  openDialogs(): void {
    const playerNotReady =
      !this.room.isStarted &&
      this.players.some(
        (player) =>
          player.userId !== this.playerService.currentPlayerSig()?.userId &&
          !player.isReady,
      );

    const playerNotDone =
      this.room.isStarted &&
      this.players.some(
        (player) =>
          player.userId !== this.playerService.currentPlayerSig()?.userId &&
          !player.finishDate,
      );

    if (playerNotReady || playerNotDone) {
      this.room.isReadyNotificationActivated =
        !this.room.isReadyNotificationActivated;
      this.roomService
        .updateRoomFields(this.room.id, {
          isReadyNotificationActivated: this.room.isReadyNotificationActivated,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (playerNotReady) {
            this.toastrHelper.info(
              'Tous les joueurs ne sont pas prêts',
              'Joueurs',
            );
          } else if (playerNotDone) {
            this.toastrHelper.info(
              "Tous les joueurs n'ont pas fini",
              'Joueurs',
            );
          }
        });
      return;
    }

    this.openAddRoomDialog();
  }

  openAddRoomDialog(): void {
    const dialogRef = this.dialog.open(AddRoomDialogComponent, {
      data: {
        stepsNumber: this.room.stepsNumber,
        startWordLength: this.room.startWordLength,
        categoryFilter: this.room.categoryFilter?.toString(),
        isWordLengthIncreasing: this.room.isWordLengthIncreasing,
        showFirstLetterMotus: this.room.showFirstLetter,
        showFirstLetterDrapeaux: this.room.showFirstLetter,
        showFirstLetterMarques: this.room.showFirstLetter,
        gameSelected: this.room.gameName,
        startAgainMode: !!this.room.startDate,
      },
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
            this.room.categoryFilter = roomData.categoryFilter;
            this.room.isWordLengthIncreasing = roomData.isWordLengthIncreasing;
            this.room.startWordLength = roomData.startWordLength;
          }

          this.start();
        },
      });
  }

  removePlayer(otherPlayer: Player): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer le joueur de la room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          otherPlayer.currentRoomWins = [];
          otherPlayer.finishDate = null;
          otherPlayer.durationMs = null;
          otherPlayer.isReady = false;

          return this.playerService.updatePlayerFields(otherPlayer.id, {
            currentRoomWins: [],
            finishDate: null,
            durationMs: null,
            isReady: false,
          });
        }),
        switchMap(() => {
          this.room.playerIds = this.room.playerIds.filter(
            (playerId) => playerId !== otherPlayer.userId,
          );
          return this.roomService.updateRoomFields(this.room.id, {
            playerIds: this.room.playerIds,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
