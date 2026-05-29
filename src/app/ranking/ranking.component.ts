import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { games } from '../../assets/data/games';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { OrdinalPipe } from '../shared/pipes/ordinal.pipe';
import { TotalMedalsNumberPipe } from '../shared/pipes/total-medals-number.pipe';

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
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
})
export class RankingComponent implements OnInit {
  playerService = inject(PlayerService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  loading = true;
  players: Player[] = [];
  sortedPlayers: Player[] = [];
  games = games;
  gameSelected = 'general';
  currentPlayerPosition?: number;

  ngOnInit(): void {
    this.playerService
      .getAllPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.players = players;
          this.sortPlayers();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  getPlayerRankingPosition(gameName: string): string {
    let sorted: Player[];

    if (gameName === 'general') {
      sorted = [...this.players].sort((a, b) => {
        const aTotal =
          a.stats?.reduce((sum, s) => sum + (s.medalsNumber ?? 0), 0) ?? 0;
        const bTotal =
          b.stats?.reduce((sum, s) => sum + (s.medalsNumber ?? 0), 0) ?? 0;
        return bTotal - aTotal;
      });
    } else {
      sorted = [...this.players].sort((a, b) => {
        const aStat = a.stats.find((stat) => stat.gameName === gameName);
        const bStat = b.stats.find((stat) => stat.gameName === gameName);

        const aMedals = aStat ? aStat.medalsNumber : 0;
        const bMedals = bStat ? bStat.medalsNumber : 0;

        return bMedals - aMedals;
      });
    }

    const currentPlayer = this.playerService.currentPlayerSig();
    if (currentPlayer) {
      const index = sorted.findIndex((p) => p.userId === currentPlayer.userId);
      if (index >= 0) {
        const position = index + 1;
        const ordinal = this.getOrdinalSuffix(position);
        return `(${position}${ordinal} / ${sorted.length})`;
      }
    }
    return '';
  }

  private getOrdinalSuffix(num: number): string {
    if (num === 1) return 'er';
    if (num === 2) return 'ème';
    return 'ème';
  }

  sortPlayers(): void {
    if (this.gameSelected === 'general') {
      this.sortedPlayers = [...this.players].sort((a, b) => {
        const aTotal =
          a.stats?.reduce((sum, s) => sum + (s.medalsNumber ?? 0), 0) ?? 0;
        const bTotal =
          b.stats?.reduce((sum, s) => sum + (s.medalsNumber ?? 0), 0) ?? 0;
        return bTotal - aTotal;
      });

      const currentPlayer = this.playerService.currentPlayerSig();
      if (currentPlayer) {
        const index = this.sortedPlayers.findIndex(
          (p) => p.userId === currentPlayer.userId,
        );
        this.currentPlayerPosition = index >= 0 ? index + 1 : undefined;
      }
    } else {
      this.sortedPlayers = [...this.players].sort((a, b) => {
        const aStat = a.stats.find(
          (stat) => stat.gameName === this.gameSelected,
        );
        const bStat = b.stats.find(
          (stat) => stat.gameName === this.gameSelected,
        );

        const aMedals = aStat ? aStat.medalsNumber : 0;
        const bMedals = bStat ? bStat.medalsNumber : 0;

        return bMedals - aMedals;
      });

      const currentPlayer = this.playerService.currentPlayerSig();
      if (currentPlayer) {
        const index = this.sortedPlayers.findIndex(
          (p) => p.userId === currentPlayer.userId,
        );
        this.currentPlayerPosition = index >= 0 ? index + 1 : undefined;
      }
    }
  }
}
