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
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { games } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomService } from '../core/services/room.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { PlayerService } from '../core/services/player.service';
import { LocalStorageService } from '../core/services/local-storage.service';

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

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
        this.updateTitle();
      });
  }

  ngOnInit(): void {
    this.roomService.roomReady$
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((room) => {
          if (!room || !room.playerIds?.length) {
            return of([]);
          }

          this.room = room;
          this.updateTitle();

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

  updateTitle(): void {
    if (this.isRoomPage()) {
      this.pageTitle = this.room?.gameName ?? '';
      return;
    }

    const staticTitles = [
      { path: '/', title: 'Game Time' },
      { path: '/profil', title: 'Profil' },
      { path: '/classement', title: 'Classement' },
      { path: '/admin', title: 'Admin' },
    ];

    const allTitles = [
      ...staticTitles,
      ...games.map((game) => ({
        path: `/${game.key}`,
        title: game.label,
      })),
    ];

    const matched = allTitles
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => this.currentUrl.startsWith(item.path));

    this.pageTitle = matched ? matched.title : '';
  }

  logout(): void {
    this.logoutEvent.emit();
  }

  isRoomPage(): boolean {
    return this.location.path().startsWith('/room') && !!this.room;
  }
}
