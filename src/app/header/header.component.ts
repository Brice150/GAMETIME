import { CommonModule, Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { games } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { RoomService } from '../core/services/room.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  router = inject(Router);
  location = inject(Location);
  roomService = inject(RoomService);
  currentUrl = '';
  menuItems = [
    { path: '/', title: 'Accueil', icon: 'bx bxs-home' },
    { path: '/profil', title: 'Profil', icon: 'bx bxs-user' },
  ];
  player = input.required<Player>();
  room?: Room;
  isOver = false;
  destroyed$ = new Subject<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  get sortedPlayersRoom() {
    if (!this.room || !this.room.playersRoom) return [];

    return [...this.room.playersRoom].sort(
      (a, b) => b.currentRoomWins.length - a.currentRoomWins.length
    );
  }

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    if (this.player().isAdmin) {
      this.menuItems.push({
        path: '/admin',
        title: 'Admin',
        icon: 'bx bxs-cog',
      });
    }

    this.roomService.roomReady$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((room) => {
        this.room = room;
        this.updateIsOver();
      });
  }

  getTitle(): string {
    if (this.isRoomPage()) {
      return this.room?.gameName ?? '';
    }

    const staticTitles = [
      { path: '/', title: 'Game Time' },
      { path: '/profil', title: 'Profil' },
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

    return matched ? matched.title : '';
  }

  logout(): void {
    this.logoutEvent.emit();
  }

  isRoomPage(): boolean {
    return this.location.path().startsWith('/room') && !!this.room;
  }

  getMedalsNumber(): number {
    const stat = this.player().stats?.find(
      (stat) => stat.gameName === this.room?.gameName
    );
    return stat?.medalsNumer ?? 0;
  }

  updateIsOver(): void {
    const playerRoom = this.room?.playersRoom.find(
      (player) => player.userId === this.player().userId
    );
    this.isOver = !!playerRoom?.isOver;
  }
}
