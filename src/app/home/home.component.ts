import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, take, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { Mode } from '../core/interfaces/mode';
import { Player } from '../core/interfaces/player';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { Room } from '../core/interfaces/room';
import { Country } from '../core/interfaces/country';
import { words } from 'src/assets/data/words';
import { countries } from 'src/assets/data/countries';
import { Continent } from '../core/enums/continent.enum';
import { PlayerRoom } from '../core/interfaces/player-room';

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
export class HomeComponent implements OnInit, OnDestroy {
  gameSelected: string = '';
  modeSelected: string = '';
  loading: boolean = true;
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
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

  get maxWordLength(): number {
    if (this.isWordLengthIncreasing) {
      return 13 - (this.stepsNumber - 1);
    }
    return 13;
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

    const showFirstLetter: boolean =
      this.gameSelected === this.motusGameKey
        ? this.showFirstLetterMotus
        : this.showFirstLetterDrapeaux;

    let countries: Country[] = [];
    let responses: string[] = [];

    if (this.gameSelected === this.drapeauxGameKey) {
      countries = this.generateCountries();
      responses = countries.map((country) => country.name);
    } else if (this.gameSelected === this.motusGameKey) {
      responses = this.generateMotusWords();
    }

    const playerRoom: PlayerRoom = {
      userId: this.player.userId!,
      username: this.player.username,
      currentRoomWins: [],
    };

    const roomToAdd: Room = {
      gameName: this.gameSelected,
      playersRoom: [playerRoom],
      isStarted: this.modeSelected === 'solo',
      isSolo: this.modeSelected === 'solo',
      showFirstLetter: showFirstLetter,
      responses: responses,
      countries: countries,
    };

    this.roomService
      .addRoom(roomToAdd)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (roomId) => {
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

  generateMotusWords(): string[] {
    const wordsToGenerate: string[] = [];
    for (let i = 0; i < this.stepsNumber; i++) {
      if (!this.isWordLengthIncreasing) {
        wordsToGenerate.push(this.newWord(this.startWordLength));
      } else {
        wordsToGenerate.push(this.newWord(this.startWordLength + i));
      }
    }
    return wordsToGenerate;
  }

  newWord(wordLength: number): string {
    const wordsFixedLength = words.filter((word) => word.length === wordLength);
    let randomIndex = Math.floor(Math.random() * wordsFixedLength.length);
    return wordsFixedLength[randomIndex];
  }

  generateCountries(): Country[] {
    const countriesToGenerate: Country[] = [];
    for (let i = 0; i < this.stepsNumber; i++) {
      countriesToGenerate.push(this.newCountry(this.continentFilter));
    }
    return countriesToGenerate;
  }

  newCountry(continentFilter: number): Country {
    if (continentFilter === Continent.Monde) {
      const randomIndex = Math.floor(Math.random() * countries.length);
      return countries[randomIndex];
    } else {
      const filteredCountries = countries.filter(
        (country) => country.continent === continentFilter
      );

      const randomIndex = Math.floor(Math.random() * filteredCountries.length);
      return filteredCountries[randomIndex];
    }
  }
}
