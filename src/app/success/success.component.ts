import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { gameMap, games, gamesByCategory } from '../../assets/data/games';
import { goals } from '../../assets/data/goals';
import { Goal } from '../core/interfaces/goal';
import { GameApiService } from '../core/services/game-api.service';
import { PlayerService } from '../core/services/player.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';

@Component({
  selector: 'app-success',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessComponent implements OnInit {
  playerService = inject(PlayerService);
  gameApi = inject(GameApiService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  games = games;
  gameGroups = gamesByCategory();
  drapeauxGameKey = gameMap['drapeaux'].key;

  readonly loading = signal(true);
  readonly gameSelected = signal<string>(this.drapeauxGameKey);

  readonly currentMedals = computed(
    () =>
      this.playerService
        .currentPlayerSig()
        ?.stats?.find((stat) => stat.gameName === this.gameSelected())
        ?.medalsNumber ?? 0,
  );

  /**
   * Un seul parcours des paliers par changement d'etat. Le template appelait
   * `isFirstAvailableSuccess` trois fois par palier, et chaque appel
   * reparcourait toute la liste.
   */
  readonly visibleGoals = computed(() => {
    const medals = this.currentMedals();
    const lastRetrieved =
      this.playerService
        .currentPlayerSig()
        ?.stats?.find((stat) => stat.gameName === this.gameSelected())
        ?.lastSuccessRetrieved ?? 0;

    let firstClaimableFound = false;

    return goals
      .filter((goal) => lastRetrieved < goal.target)
      .map((goal) => {
        const progress = Math.min(100, (medals / goal.target) * 100);
        const isClaimable = progress === 100 && !firstClaimableFound;

        if (progress === 100) {
          firstClaimableFound = true;
        }

        return { goal, progress, isReached: progress === 100, isClaimable };
      });
  });

  ngOnInit(): void {
    this.playerService.playerReady$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  medalsFor(gameName: string): number {
    return (
      this.playerService
        .currentPlayerSig()
        ?.stats?.find((stat) => stat.gameName === gameName)?.medalsNumber ?? 0
    );
  }

  // La recompense est attribuee par le serveur : le palier et son gain sont
  // verifies la-bas, le client ne fait que demander.
  getSuccess(goal: Goal): void {
    const player = this.playerService.currentPlayerSig();
    const stat = player?.stats.find(
      (stat) => stat.gameName === this.gameSelected(),
    );

    if (!player || !stat) {
      return;
    }

    this.gameApi
      .claimGoal(this.gameSelected(), goal.target)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          stat.lastSuccessRetrieved = goal.target;
          stat.medalsNumber = result.medalsNumber;
          this.playerService.currentPlayerSig.set({ ...player });
          this.toastrHelper.info('Succès récupéré', 'Succès');
        },
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error);
        },
      });
  }
}
