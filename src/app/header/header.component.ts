import { CommonModule, Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    MedalsNumberPipe,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  router = inject(Router);
  location = inject(Location);
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  localStorageService = inject(LocalStorageService);
  currentUrl = '';
  player = input.required<Player>();
  room?: Room;
  players: Player[] = [];
  destroyed$ = new Subject<void>();
  pageTitle = '';
  @Output() logoutEvent = new EventEmitter<void>();

  ngOnInit(): void {
    this.roomService.roomReady$
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((room) => {
          if (!room || !room.playerIds?.length) {
            return of([]);
          }

          this.room = room;

          return this.playerService.playersReady$;
        })
      )
      .subscribe((players) => {
        this.players = players.sort(
          (a, b) => b.currentRoomWins.length - a.currentRoomWins.length
        );
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  logout(): void {
    this.logoutEvent.emit();
  }

  isRoomPage(): boolean {
    return !!this.room && this.location.path().startsWith('/room');
  }
}
