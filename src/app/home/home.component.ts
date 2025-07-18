import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Games } from '../core/enums/games.enum';
import { PlayerService } from '../core/services/player.service';
import { Subject, take, takeUntil } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  imagePath: string = environment.imagePath;
  games = Games;
  gameSelected: string = '';
  loading: boolean = true;
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  destroyed$ = new Subject<void>();
  player: Player = {} as Player;

  ngOnInit(): void {
    this.playerService
      .getPlayers()
      .pipe(take(1), takeUntil(this.destroyed$))
      .subscribe({
        next: (players: Player[]) => {
          if (players?.length > 0) {
            this.player = players[0];
          }
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

  getMedalsNumber(gameName: string): number {
    const stat = this.player?.stats?.find((stat) => stat.gameName === gameName);
    return stat?.medalsNumer ?? 0;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
