import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { Mode } from '../core/interfaces/mode';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';

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
export class HomeComponent implements OnDestroy {
  gameSelected: string = '';
  modeSelected: string = '';
  loading: boolean = false;
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  destroyed$ = new Subject<void>();
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

  get maxWordLength(): number {
    if (this.isWordLengthIncreasing) {
      return 13 - (this.stepsNumber - 1);
    }
    return 13;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  getMedalsNumber(gameName: string): number {
    const stat = this.playerService
      .currentPlayerSig()
      ?.stats?.find((stat) => stat.gameName === gameName);
    return stat?.medalsNumer ?? 0;
  }

  formatLabel(index: number): string {
    const continentLabels = [
      '', // index 0 unused
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

  play(): void {
    this.loading = true;

    const newRoom = this.roomService.newRoom(
      this.gameSelected,
      this.modeSelected,
      this.showFirstLetterMotus,
      this.showFirstLetterDrapeaux,
      this.stepsNumber,
      this.isWordLengthIncreasing,
      this.startWordLength,
      this.continentFilter,
      this.playerService.currentPlayerSig()!,
      false
    );

    this.roomService
      .deleteUserRooms()
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => this.roomService.addRoom(newRoom))
      )
      .subscribe({
        next: (roomId) => {
          this.localStorageService.saveStartAgainNumber(
            newRoom.startAgainNumber
          );
          this.loading = false;
          this.router.navigate([`/room/${roomId}`]);
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
}
