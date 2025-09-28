import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { games } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
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
export class RankingComponent implements OnInit, OnDestroy {
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  players: Player[] = [];
  sortedPlayers: Player[] = [];
  games = games;
  gameSelected: string = 'general';
  currentPlayerPosition?: number;

  ngOnInit(): void {
    this.playerService
      .getAllPlayers()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (players) => {
          this.players = players;
          this.sortPlayers();
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
          (p) => p.userId === currentPlayer.userId
        );
        this.currentPlayerPosition = index >= 0 ? index + 1 : undefined;
      }
    } else {
      this.sortedPlayers = [...this.players].sort((a, b) => {
        const aStat = a.stats.find(
          (stat) => stat.gameName === this.gameSelected
        );
        const bStat = b.stats.find(
          (stat) => stat.gameName === this.gameSelected
        );

        const aMedals = aStat ? aStat.medalsNumber : 0;
        const bMedals = bStat ? bStat.medalsNumber : 0;

        return bMedals - aMedals;
      });

      const currentPlayer = this.playerService.currentPlayerSig();
      if (currentPlayer) {
        const index = this.sortedPlayers.findIndex(
          (p) => p.userId === currentPlayer.userId
        );
        this.currentPlayerPosition = index >= 0 ? index + 1 : undefined;
      }
    }
  }
}
