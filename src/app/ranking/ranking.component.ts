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
import { games, gamesByCategory } from '../../assets/data/games';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { getTotalMedalsNumber } from '../core/utils/medals.util';
import { ordinalSuffix } from '../core/utils/ordinal.util';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { OrdinalPipe } from '../shared/pipes/ordinal.pipe';
import { TotalMedalsNumberPipe } from '../shared/pipes/total-medals-number.pipe';
import { SuccessComponent } from '../success/success.component';

@Component({
  selector: 'app-ranking',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MedalsNumberPipe,
    FormsModule,
    OrdinalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TotalMedalsNumberPipe,
    SuccessComponent,
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingComponent implements OnInit {
  playerService = inject(PlayerService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  games = games;
  gameGroups = gamesByCategory();

  readonly loading = signal(true);
  readonly tab = signal<'classement' | 'succes'>('classement');
  readonly gameSelected = signal('general');
  // Le classement entre amis est plus parlant que le classement global : il
  // est propose par defaut des que le joueur a au moins un ami.
  readonly scope = signal<'amis' | 'tous'>('amis');
  private readonly players = signal<Player[]>([]);

  readonly hasFriends = computed(
    () => !!this.playerService.currentPlayerSig()?.friendIds?.length,
  );

  // Le joueur courant fait toujours partie de son propre classement.
  private readonly scopedPlayers = computed(() => {
    const currentPlayer = this.playerService.currentPlayerSig();

    if (this.scope() === 'tous') {
      return this.players();
    }

    const friendIds = currentPlayer?.friendIds ?? [];

    return this.players().filter(
      (player) =>
        player.userId === currentPlayer?.userId ||
        (!!player.userId && friendIds.includes(player.userId)),
    );
  });

  readonly sortedPlayers = computed(() =>
    this.sortBy(this.scopedPlayers(), this.gameSelected()),
  );

  readonly currentPlayerPosition = computed(() => {
    const currentUserId = this.playerService.currentPlayerSig()?.userId;
    const index = this.sortedPlayers().findIndex(
      (player) => player.userId === currentUserId,
    );

    return index >= 0 ? index + 1 : undefined;
  });

  // Les positions etaient recalculees pour chaque jeu a chaque cycle de
  // detection : quatre tris de toute la collection par passage.
  readonly positions = computed<Record<string, string>>(() => {
    const currentUserId = this.playerService.currentPlayerSig()?.userId;
    const scoped = this.scopedPlayers();
    const entries: Record<string, string> = {};

    for (const key of ['general', ...this.games.map((game) => game.key)]) {
      const sorted = this.sortBy(scoped, key);
      const index = sorted.findIndex(
        (player) => player.userId === currentUserId,
      );

      entries[key] =
        index >= 0
          ? `(${index + 1}${ordinalSuffix(index + 1)} / ${sorted.length})`
          : '';
    }

    return entries;
  });

  ngOnInit(): void {
    this.playerService
      .getAllPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.players.set(players);

          if (!this.hasFriends()) {
            this.scope.set('tous');
          }

          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  private medalsFor(player: Player, gameName: string): number {
    if (gameName === 'general') {
      return getTotalMedalsNumber(player);
    }

    return (
      player.stats?.find((stat) => stat.gameName === gameName)?.medalsNumber ??
      0
    );
  }

  private sortBy(players: Player[], gameName: string): Player[] {
    return [...players].sort(
      (a, b) => this.medalsFor(b, gameName) - this.medalsFor(a, gameName),
    );
  }
}
