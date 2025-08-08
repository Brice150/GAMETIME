import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { gameMap } from 'src/assets/data/games';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-ranking',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MedalsNumberPipe,
    FormsModule,
    MatSlideToggleModule,
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
  gameName: string = gameMap['drapeaux'].key;
  isDrapeauSelected = true;

  ngOnInit(): void {
    this.playerService
      .getAllPlayers()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (players) => {
          this.players = players.sort((a, b) => {
            const aStat = a.stats.find(
              (stat) => stat.gameName === this.gameName
            );
            const bStat = b.stats.find(
              (stat) => stat.gameName === this.gameName
            );

            const aMedals = aStat ? aStat.medalsNumber : 0;
            const bMedals = bStat ? bStat.medalsNumber : 0;

            return bMedals - aMedals;
          });

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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
