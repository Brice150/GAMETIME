import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
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
  forkJoin,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  timer,
} from 'rxjs';
import {
  gameMap,
  randomGameKey,
  resolveGameKey,
  restartVoteKey,
  voteMap,
} from '../../assets/data/games';
import { goals } from '../../assets/data/goals';

import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomForm } from '../core/interfaces/room-form';
import { RoundAnswer } from '../core/interfaces/round-answer';
import { RoundProgress } from '../core/interfaces/round-progress';
import { RoundResult } from '../core/interfaces/round-result';

import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { GameApiService } from '../core/services/game-api.service';
import { AddRoomDialogComponent } from '../shared/components/add-room-dialog/add-room-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MultiplayerDialogComponent } from '../shared/components/multiplayer-dialog/multiplayer-dialog.component';

import { LiveStandingsComponent } from './live-standings/live-standings.component';
import { ResultsBoardComponent } from './results-board/results-board.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { WordGamesComponent } from './word-games/word-games.component';

const NEXT_ROUND_DELAY_MS = 1000;

@Component({
  selector: 'app-room',
  imports: [
    WordGamesComponent,
    WaitingRoomComponent,
    ResultsBoardComponent,
    LiveStandingsComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnInit {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  gameApi = inject(GameApiService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  activatedRoute = inject(ActivatedRoute);
  localStorageService = inject(LocalStorageService);
  dialog = inject(MatDialog);
  destroyRef = inject(DestroyRef);
  changeDetectorRef = inject(ChangeDetectorRef);
  readonly loading = signal(true);
  room: Room = {} as Room;
  players: Player[] = [];
  readonly lastRound = signal<RoundResult | null>(null);
  readonly isResultPageActive = signal(false);
  userLeft = false;
  userKickedOut = false;
  readonly isFinishing = signal(false);
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
          this.loading.set(false);
          this.toastrHelper.handleError(error);
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
      this.isResultPageActive.set(false);
      this.lastRound.set(null);
    }

    this.room = room;

    if (!this.room.isStarted) {
      this.roomService.preloadGameData(this.room.gameName);
    }

    if (currentUserId && this.room.playerIds.includes(currentUserId)) {
      return this.room;
    }

    if (!this.userLeft && !this.userKickedOut) {
      if (!currentUserId) {
        return this.room;
      }

      this.localStorageService.newGame(this.room.id!);
      this.room.playerIds.push(currentUserId);

      // Entrer ici vaut sortie des rooms precedentes, meme sans « Quitter ».
      this.roomService
        .leaveOtherRooms(this.room.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();

      this.roomService
        .addPlayerToRoom(this.room.id, currentUserId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastrHelper.handleError(error);
          },
        });
      return this.room;
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

        // Sans ce garde, deux joueurs non termines donnaient `NaN`.
        const aDuration = a.durationMs ?? Infinity;
        const bDuration = b.durationMs ?? Infinity;

        if (aDuration !== bDuration) {
          return aDuration - bDuration;
        }

        return this.lettersFound(b) - this.lettersFound(a);
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
      } else if (!this.isFinishing()) {
        this.isResultPageActive.set(true);
      }
    } else if (this.isLateJoinerAfterEnd(currentPlayer)) {
      this.skipFinishedRound(currentPlayer!);
    } else if (
      currentPlayer?.finishDate &&
      this.room.isStarted &&
      !this.room.isLoading &&
      !this.isFinishing()
    ) {
      // Arrive apres la fin : la page resultats reste affichee tant que
      // l'hote n'a pas relance.
      this.isResultPageActive.set(true);
    }

    this.roomService.currentRoomSig.set(this.room);
    this.playerService.currentPlayersSig.set(this.players);
    this.changeDetectorRef.markForCheck();
    this.loading.set(this.room.isLoading ?? false);
  }

  lettersFound(player: Player): number {
    const progress = player.currentRoundProgress;

    return progress && progress.stepIndex === player.currentRoomWins.length
      ? progress.lettersFound
      : 0;
  }

  // Rejoindre une partie que tout le monde a deja terminee ferait rejouer la
  // manche entiere en solo : le joueur est simplement classe dernier, sans
  // resultat, et bascule directement sur les resultats.
  isLateJoinerAfterEnd(currentPlayer: Player | null | undefined): boolean {
    const startedPlayerIds = this.room.startedPlayerIds;

    if (
      !currentPlayer?.userId ||
      !this.room.isStarted ||
      this.room.isLoading ||
      !startedPlayerIds?.length ||
      startedPlayerIds.includes(currentPlayer.userId) ||
      !!currentPlayer.finishDate ||
      currentPlayer.currentRoomWins.length > 0
    ) {
      return false;
    }

    const participants = this.players.filter(
      (player) => player.userId && startedPlayerIds.includes(player.userId),
    );

    return (
      participants.length > 0 &&
      participants.every((player) => !!player.finishDate)
    );
  }

  skipFinishedRound(currentPlayer: Player): void {
    currentPlayer.currentRoomWins = [];
    currentPlayer.finishDate = new Date();
    currentPlayer.durationMs = null;
    currentPlayer.isReady = true;
    currentPlayer.currentRoundProgress = null;
    this.isResultPageActive.set(true);

    this.playerService
      .updatePlayerFields(currentPlayer.id, {
        currentRoomWins: [],
        finishDate: currentPlayer.finishDate,
        durationMs: null,
        isReady: true,
        currentRoundProgress: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastrHelper.info(
            'La partie était déjà terminée, vous verrez les résultats',
            'Room',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error);
        },
      });
  }

  // La manche part au serveur : lui seul attribue la medaille, le client ne
  // peut plus ecrire `stats`. L'affichage avance sans attendre la reponse,
  // et revient en arriere si l'enregistrement echoue.
  updatePlayerGame(round: RoundAnswer): void {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer) {
      return;
    }

    const stepIndex = currentPlayer.currentRoomWins.length;
    const justFinished =
      stepIndex + 1 === this.room.responses?.length &&
      !currentPlayer.finishDate;

    currentPlayer.currentRoomWins.push(round.won);

    if (justFinished) {
      this.stampFinish(currentPlayer);
    }

    this.gameApi
      .submitRound(
        this.room.id!,
        stepIndex,
        round.answer,
        justFinished ? currentPlayer.durationMs : null,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          // Le serveur a le dernier mot : en jeu honnete son verdict rejoint
          // celui affiche, la manche n'ayant pas a attendre la reponse.
          currentPlayer.currentRoomWins[stepIndex] = result.won;
          this.announceGoal(result.medalsNumber, result.won);
          this.handlePlayerNextAction(result.won, stepIndex);
        },
        error: (error: HttpErrorResponse) => {
          currentPlayer.currentRoomWins.splice(stepIndex);
          this.playerService.currentPlayerSig.set({ ...currentPlayer });
          this.toastrHelper.error(
            "La manche n'a pas pu être enregistrée : " + error.message,
          );
        },
      });

    if (justFinished) {
      this.showResultsAfterPause();
    }
  }

  announceGoal(medalsNumber: number, stepWon: boolean): void {
    if (!stepWon) {
      return;
    }

    const goal = goals.find((goal) => goal.target === medalsNumber);

    if (!goal) {
      return;
    }

    this.toastrHelper.info(
      'Vous avez obtenu le succès : Obtenir ' + goal.target + ' médailles',
      this.room.gameName.charAt(0).toUpperCase() + this.room.gameName.slice(1),
    );
  }

  stampFinish(player: Player): void {
    player.finishDate = new Date();
    player.durationMs =
      this.localStorageService.getElapsedMs(
        this.room.id!,
        this.room.startAgainNumber,
      ) ?? this.elapsedSinceRoomStart();
    player.isReady = true;
    this.isFinishing.set(true);
  }

  // Le chrono local peut manquer (stockage vide, autre appareil) : sans ce
  // repli le joueur finissait sans temps, donc classe dernier alors qu'il a
  // joue la partie.
  elapsedSinceRoomStart(): number | null {
    const startDate =
      this.room.startDate instanceof Timestamp
        ? this.room.startDate.toDate()
        : this.room.startDate;

    if (!startDate) {
      return null;
    }

    return Math.max(0, Date.now() - startDate.getTime());
  }

  // Le temps est deja enregistre et publie : ces 3 secondes ne servent qu'a
  // laisser le joueur lire sa derniere manche.
  showResultsAfterPause(): void {
    timer(3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isResultPageActive.set(true);
        this.playerService.currentPlayerSig.set(
          this.playerService.currentPlayerSig(),
        );
        this.isFinishing.set(false);
      });
  }

  handlePlayerNextAction(stepWon: boolean, stepIndex: number): void {
    this.lastRound.set({
      stepIndex,
      response: this.room.responses[stepIndex],
      won: stepWon,
    });

    this.playerService.currentPlayerSig.set(
      this.playerService.currentPlayerSig(),
    );

    if (stepIndex + 1 === this.room.responses.length) {
      return;
    }

    timer(NEXT_ROUND_DELAY_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.wordGamesComponent?.new());
  }

  publishProgress(progress: {
    lettersFound: number;
    lettersTotal: number;
  }): void {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer || currentPlayer.finishDate || !progress.lettersTotal) {
      return;
    }

    const currentRoundProgress: RoundProgress = {
      stepIndex: currentPlayer.currentRoomWins.length,
      lettersFound: progress.lettersFound,
      lettersTotal: progress.lettersTotal,
    };

    currentPlayer.currentRoundProgress = currentRoundProgress;

    this.playerService
      .updatePlayerFields(currentPlayer.id, { currentRoundProgress })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  openDialog(): void {
    const isHost =
      this.playerService.currentPlayerSig()?.userId === this.room.userId;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: isHost ? 'supprimer cette room' : 'quitter cette room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => (isHost ? this.deleteRoom() : this.leaveRoom()));
  }

  deleteRoom(): void {
    this.loading.set(true);
    this.userLeft = true;

    // Remise a zero locale seulement : cote base, c'est la fonction
    // `onRoomDeleted` qui s'en charge. L'ecrire ici aussi imposait un
    // aller-retour de plus avant que la suppression ne parte.
    this.players.forEach((player) => {
      player.currentRoomWins = [];
      player.finishDate = null;
      player.durationMs = null;
      player.isReady = false;
      player.currentRoundProgress = null;
      player.vote = null;
    });

    // Hors `takeUntilDestroyed` : l'ecoute de la room voit la suppression des
    // le cache local et quitte la page avant la reponse du serveur. Rattachee
    // au composant, cette souscription mourait avec lui, et un refus
    // d'ecriture passait inapercu.
    this.roomService.deleteRoom(this.room.id!).subscribe({
      next: () => {
        this.quitRoomView();
        this.toastrHelper.info('La room a été supprimée', 'Room');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastrHelper.handleError(error, true);
      },
    });
  }

  // Sortir ne depend d'aucune reponse du serveur : enchainer les deux
  // ecritures avant de rendre la main laissait le joueur devant un ecran de
  // chargement le temps de deux allers-retours. Elles partent ensemble, la
  // page bascule aussitot, et seul un echec est encore signale.
  leaveRoom(): void {
    this.userLeft = true;

    const currentPlayer = this.playerService.currentPlayerSig();
    const userId = currentPlayer?.userId;

    this.room.playerIds = this.room.playerIds.filter(
      (playerId) => playerId !== userId,
    );

    const writes: Observable<void>[] = [];

    if (userId) {
      writes.push(this.roomService.removePlayerFromRoom(this.room.id, userId));
    }

    if (currentPlayer) {
      currentPlayer.currentRoomWins = [];
      currentPlayer.finishDate = null;
      currentPlayer.durationMs = null;
      currentPlayer.isReady = false;
      currentPlayer.currentRoundProgress = null;
      currentPlayer.vote = null;

      writes.push(
        this.playerService.updatePlayerFields(currentPlayer.id, {
          currentRoomWins: [],
          finishDate: null,
          durationMs: null,
          isReady: false,
          currentRoundProgress: null,
          vote: null,
        }),
      );

      // Nouvelle reference : le signal ne rediffuse pas un objet mute en
      // place, et l'entete gardait le score de la partie quittee.
      this.playerService.currentPlayerSig.set({ ...currentPlayer });
    }

    this.quitRoomView();
    this.toastrHelper.info('Vous venez de quitter une room', 'Room');

    // Hors `takeUntilDestroyed` : la navigation detruit ce composant avant la
    // reponse du serveur, et un echec doit rester dit. Une room disparue
    // entre-temps n'en est pas un, le joueur en est sorti quand meme.
    forkJoin(writes.length ? writes : [of(undefined)]).subscribe({
      error: (error: HttpErrorResponse) => {
        if (!error.message?.includes('No document to update')) {
          this.toastrHelper.handleError(error);
        }
      },
    });
  }

  quitRoomView(): void {
    this.roomService.currentRoomSig.set(undefined);
    this.playerService.currentPlayersSig.set([]);
    this.localStorageService.clearLocalStorage();
    this.router.navigate(['/accueil']);
  }

  vote(choice: string): void {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (!currentPlayer) {
      return;
    }

    const vote = currentPlayer.vote === choice ? null : choice;
    currentPlayer.vote = vote;

    // Avant le lancement le vote a remplace le bouton « Pret » : voter suffit
    // a se declarer disponible, retirer son vote revient en arriere.
    const fields: Partial<Player> = { vote };

    if (!this.room.isStarted) {
      currentPlayer.isReady = !!vote;
      fields.isReady = currentPlayer.isReady;
    }

    this.playerService
      .updatePlayerFields(currentPlayer.id, fields)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error);
        },
      });
  }

  // Un joueur qui n'a pas vote, faute d'avoir fini ou de s'etre prononce,
  // compte pour « Peu importe » : son silence ne bloque pas le depouillement.
  // Ce report reste interne, les compteurs affiches aux joueurs ne montrant
  // que les votes exprimes. Sans aucun vote il n'y a rien a depouiller.
  // L'hote est hors scrutin : il tranche dans la fenetre de lancement, son
  // abstention n'a donc pas a peser pour « Peu importe ».
  winningVote(): string | null {
    const voters = this.players.filter(
      (player) => player.userId !== this.room.userId,
    );

    if (voters.every((player) => !player.vote)) {
      return null;
    }

    const counts = new Map<string, number>();

    for (const player of voters) {
      const vote = player.vote ?? randomGameKey;
      counts.set(vote, (counts.get(vote) ?? 0) + 1);
    }

    let winner: string | null = null;
    let best = 0;

    // Ordre des options : une egalite donne toujours le meme gagnant, et
    // « Peu importe », en dernier, ne l'emporte qu'a defaut.
    for (const key of Object.keys(voteMap)) {
      const count = counts.get(key) ?? 0;

      if (count > best) {
        best = count;
        winner = key;
      }
    }

    return winner;
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
          this.toastrHelper.handleError(error);
        },
      });

    this.showResultsAfterPause();
  }

  start(): void {
    this.loading.set(true);
    this.lastRound.set(null);

    this.room.responses = [];
    this.room.prompts = [];
    this.room.media = [];
    this.room.isLoading = true;
    this.room.lastActivityAt = new Date();
    this.room.startedPlayerIds = this.players
      .map((player) => player.userId)
      .filter((userId): userId is string => !!userId);

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
            player.currentRoundProgress = null;
            player.vote = null;
          });
          return this.playerService.resetPlayersState(this.players);
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
          this.isResultPageActive.set(false);

          this.roomService.currentRoomSig.set(this.room);
          this.playerService.currentPlayersSig.set(this.players);
          this.playerService.currentPlayerSig.set(
            this.players.find(
              (player) =>
                player.userId === this.playerService.currentPlayerSig()?.userId,
            )!,
          );

          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.resetRoom();
          this.toastrHelper.handleError(error);
        },
      });
  }

  generateQuestions(): Observable<Room> {
    return from(this.roomService.drawRounds(this.room)).pipe(
      map((rounds) => {
        this.room.responses = rounds.map((round) => round.response);
        this.room.prompts = rounds.map((round) => round.prompt);
        this.room.media = rounds.map((round) => round.media);
        return this.room;
      }),
    );
  }

  resetRoom(): void {
    this.room.isStarted = false;
    this.room.startDate = null;
    this.room.isLoading = false;

    this.roomService
      .updateRoom(this.room)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loading.set(false);
      });
  }

  multiplayer(): void {
    this.dialog.open(MultiplayerDialogComponent, { data: this.room });
  }

  shouldShowPlayButton(): boolean {
    const userId = this.playerService.currentPlayerSig()?.userId;
    return (
      (this.isResultPageActive() && userId === this.room.userId) ||
      (!this.room.isStarted && userId === this.room.userId)
    );
  }

  // Les votes manquants ne retiennent plus l'hote : ils comptent pour
  // « Peu importe » au depouillement. Une manche en cours, elle, doit encore
  // s'achever avant d'etre relancee, sans quoi le retardataire perdrait sa
  // partie en pleine saisie.
  openDialogs(): void {
    const playerNotDone =
      this.room.isStarted &&
      this.players.some(
        (player) =>
          player.userId !== this.playerService.currentPlayerSig()?.userId &&
          !player.finishDate,
      );

    if (playerNotDone) {
      this.toastrHelper.info("Tous les joueurs n'ont pas fini", 'Joueurs');
      return;
    }

    this.openAddRoomDialog();
  }

  // La fenetre s'ouvre sur le resultat du vote : le jeu majoritaire s'il y
  // en a un, « Aleatoire » si « Peu importe » l'emporte, et le jeu en cours
  // pour « Recommencer », ses reglages etant de toute facon repris tels quels.
  openAddRoomDialog(): void {
    const winner = this.winningVote();
    const votedGame = winner && winner !== restartVoteKey ? winner : null;

    const dialogRef = this.dialog.open(AddRoomDialogComponent, {
      data: {
        stepsNumber: this.room.stepsNumber,
        startWordLength: this.room.startWordLength,
        categoryFilter: this.room.categoryFilter?.toString(),
        isWordLengthIncreasing: this.room.isWordLengthIncreasing,
        showFirstLetter: this.room.showFirstLetter,
        gameSelected: votedGame ?? this.room.gameName ?? '',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(filter((roomData: RoomForm) => !!roomData))
      .subscribe({
        next: (roomData: RoomForm) => {
          if (roomData && roomData.gameSelected) {
            const gameName = resolveGameKey(roomData.gameSelected);
            this.room.gameName = gameName;
            this.room.showFirstLetter = roomData.showFirstLetter;
            this.room.stepsNumber = roomData.stepsNumber;
            this.room.categoryFilter = roomData.categoryFilter;
            this.room.isWordLengthIncreasing = roomData.isWordLengthIncreasing;
            this.room.startWordLength = roomData.startWordLength;

            if (roomData.gameSelected === randomGameKey) {
              this.toastrHelper.info(
                `Le sort a désigné : ${gameMap[gameName]?.label ?? gameName}`,
                'Room',
              );
            }
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
          otherPlayer.currentRoundProgress = null;
          otherPlayer.vote = null;

          return this.playerService.updatePlayerFields(otherPlayer.id, {
            currentRoomWins: [],
            finishDate: null,
            durationMs: null,
            isReady: false,
            currentRoundProgress: null,
            vote: null,
          });
        }),
        switchMap(() => {
          this.room.playerIds = this.room.playerIds.filter(
            (playerId) => playerId !== otherPlayer.userId,
          );
          return otherPlayer.userId
            ? this.roomService.removePlayerFromRoom(
                this.room.id,
                otherPlayer.userId,
              )
            : of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
