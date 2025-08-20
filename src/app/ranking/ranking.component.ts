import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { gameMap, games } from 'src/assets/data/games';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrdinalPipe } from '../shared/pipes/ordinal.pipe';

@Component({
  selector: 'app-ranking',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MedalsNumberPipe,
    FormsModule,
    MatSlideToggleModule,
    OrdinalPipe,
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
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  gameSelected: string = this.drapeauxGameKey;
  isDrapeauSelected = true;
  currentPlayerPosition?: number;

  ngOnInit(): void {
    this.playerService
      .getAllPlayers()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (players) => {
          this.players = players;
          this.sortPlayers(this.gameSelected);
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

  sortPlayers(gameSelected: string): void {
    this.gameSelected = gameSelected;

    this.sortedPlayers = this.players.sort((a, b) => {
      const aStat = a.stats.find((stat) => stat.gameName === this.gameSelected);
      const bStat = b.stats.find((stat) => stat.gameName === this.gameSelected);

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
