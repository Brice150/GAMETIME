import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, take, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { environment } from 'src/environments/environment';
import { Mode } from '../core/interfaces/mode';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { Continent } from '../core/enums/continent.enum';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    FormsModule,
    MatSlideToggleModule,
  ],
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
  stepsNumber: number = 3;
  startWordLength: number = 5;
  continentFilter: number = 1;
  isWordLengthIncreasing = true;
  showFirstLetterMotus = true;
  showFirstLetterDrapeaux = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
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

  get dynamicSliderValue(): number {
    return this.gameSelected === this.motusGameKey
      ? this.startWordLength
      : this.continentFilter;
  }

  set dynamicSliderValue(value: number) {
    if (this.gameSelected === this.motusGameKey) {
      this.startWordLength = value;
    } else {
      this.continentFilter = value;
    }
  }

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

  play(): void {
    this.router.navigate(['/', this.gameSelected]);
  }

  formatLabel(index: number): string {
    const continentLabels = [
      '', // index 0 non utilisé
      'Monde',
      'Europe',
      'Asie',
      'Afrique',
      'Amérique',
      'Océanie',
    ];

    return continentLabels[index];
  }

  defaultFormatLabel(value: number): string {
    return value.toString();
  }
}
