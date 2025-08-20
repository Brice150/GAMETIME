import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, switchMap, take, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { JoinRoomComponent } from './join-room/join-room.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    FormsModule,
    MatSlideToggleModule,
    MedalsNumberPipe,
    JoinRoomComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnDestroy {
  gameSelected: string = '';
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
  categoryFilter: number = 1;
  isWordLengthIncreasing = true;
  showFirstLetterMotus = true;
  showFirstLetterDrapeaux = false;
  showFirstLetterMarques = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;

  get dynamicSliderValue(): number {
    if (this.gameSelected === this.motusGameKey) return this.startWordLength;
    else if (this.gameSelected === this.drapeauxGameKey)
      return this.continentFilter;
    else if (this.gameSelected === this.marquesGameKey)
      return this.categoryFilter;
    return this.startWordLength;
  }

  set dynamicSliderValue(value: number) {
    if (this.gameSelected === this.motusGameKey) {
      this.startWordLength = value;
    } else if (this.gameSelected === this.drapeauxGameKey) {
      this.continentFilter = value;
    } else if (this.gameSelected === this.marquesGameKey) {
      this.categoryFilter = value;
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

  formatLabelContinent(index: number): string {
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

  formatLabelCategory(index: number): string {
    const categoryLabels = [
      '', // index 0 unused
      'Tout',
      'Voitures',
      'Digital',
      'Mode',
      'Aliments',
    ];
    return categoryLabels[index];
  }

  defaultFormatLabel(value: number): string {
    return value.toString();
  }

  play(): void {
    this.loading = true;

    const newRoom = this.roomService.newRoom(
      this.gameSelected,
      this.showFirstLetterMotus,
      this.showFirstLetterDrapeaux,
      this.showFirstLetterMarques,
      this.stepsNumber,
      this.isWordLengthIncreasing,
      this.startWordLength,
      this.continentFilter,
      this.categoryFilter,
      this.playerService.currentPlayerSig()?.userId!,
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
          this.localStorageService.newGame(roomId);
          this.loading = false;
          this.router.navigate([`/room/${roomId}`]);
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

  joinRoom(roomCode: string): void {
    this.roomService
      .getRoomsByCode(roomCode)
      .pipe(take(1))
      .subscribe((rooms) => {
        if (rooms && rooms.length > 0) {
          const room = rooms[0];
          this.localStorageService.newGame(room.id!);
          this.loading = false;
          this.router.navigate([`/room/${room.id!}`]);
        } else {
          this.toastr.error('Aucune room trouvée avec ce code', 'Game Time', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          });
        }
      });
  }
}
