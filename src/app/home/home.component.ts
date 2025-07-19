import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, take, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Mode } from '../core/interfaces/mode';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { games } from 'src/assets/data/games';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  imagePath: string = environment.imagePath;
  gameSelected: string = '';
  modeSelected: string = '';
  loading: boolean = true;
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  destroyed$ = new Subject<void>();
  player: Player = {} as Player;
  router = inject(Router);
  games = games;
  modes: Mode[] = [
    {
      key: 'solo',
      label: 'Solo',
      icon: 'bx bx-user',
    },
    {
      key: 'multi',
      label: 'Multijoueur',
      icon: 'bx bx-group',
      onClick: () => this.alerte(),
    },
  ];

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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  alerte(): void {
    this.toastr.error(
      'Le mode multijoueur est en cours de développement',
      'Game Time',
      {
        positionClass: 'toast-bottom-center',
        toastClass: 'ngx-toastr custom error',
      }
    );
  }

  getMedalsNumber(gameName: string): number {
    const stat = this.player?.stats?.find((stat) => stat.gameName === gameName);
    return stat?.medalsNumer ?? 0;
  }
}
