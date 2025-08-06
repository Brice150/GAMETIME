import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { Room } from '../core/interfaces/room';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { DurationBetweenDatesPipe } from '../shared/pipes/duration.pipe';
import { Player } from '../core/interfaces/player';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-admin-room',
  imports: [
    CommonModule,
    DurationBetweenDatesPipe,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
    MedalsNumberPipe,
  ],
  templateUrl: './admin-room.component.html',
  styleUrl: './admin-room.component.css',
})
export class AdminRoomComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  room: Room = {} as Room;
  players: Player[] = [];
  roomService = inject(RoomService);
  activatedRoute = inject(ActivatedRoute);
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  destroyed$ = new Subject<void>();
  hideResults = true;

  get sortedPlayers() {
    return [...this.players].sort((a, b) => {
      const aTrueCount = a.currentRoomWins.filter(Boolean).length;
      const bTrueCount = b.currentRoomWins.filter(Boolean).length;

      if (bTrueCount !== aTrueCount) {
        return bTrueCount - aTrueCount;
      }

      const aFinish = this.toJsDate(a.finishDate).getTime();
      const bFinish = this.toJsDate(b.finishDate).getTime();

      return aFinish - bFinish;
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((params) => this.roomService.getRoom(params['id'])),
        switchMap((room) => {
          this.room = room;
          if (!room || !room.playerIds?.length) {
            return of([]);
          }
          return this.playerService.getPlayers(room.playerIds);
        })
      )
      .subscribe({
        next: (players) => {
          this.players = players;
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

  toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }

  share(): void {
    let link = window.location.href;

    link = link.replace('/admin/', '/room/');

    navigator.clipboard.writeText(link).then(() => {
      this.toastr.info(
        'Lien de la partie copié, envoyez ce lien à vos amis pour jouer en multijoueur !',
        'Game Time',
        {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom info',
        }
      );
    });
  }

  start(): void {
    if (this.players.length === 0) {
      this.toastr.error(
        'Pour être lancée, une room doit avoir des joueurs',
        'Admin',
        {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom error',
        }
      );
      return;
    }

    this.loading = true;

    this.room.countries = [];
    this.room.responses = [];

    this.room.isStarted = true;
    this.room.startDate = new Date();
    this.room.startAgainNumber += 1;
    this.room.isStarted = true;
    this.players.forEach((player) => {
      player.isOver = false;
      player.finishDate = null;
      player.currentRoomWins = [];
    });

    this.roomService.generateResponses(
      this.room.gameName,
      this.room.stepsNumber,
      this.room.continentFilter,
      this.room.isWordLengthIncreasing,
      this.room.startWordLength,
      this.room.countries,
      this.room.responses
    );

    this.roomService
      .updateRoom(this.room)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => this.playerService.updatePlayers(this.players))
      )
      .subscribe({
        next: () => {
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

  stop(): void {
    this.loading = true;

    this.players.forEach((player) => {
      player.isOver = true;
      for (let i = 0; i < this.room.responses.length; i++) {
        if (player.currentRoomWins[i] === undefined) {
          player.currentRoomWins.push(false);
        }
      }
    });

    this.playerService
      .updatePlayers(this.players)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
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

  allPlayersDone(): boolean {
    return this.players.every((player) => player.isOver);
  }
}
