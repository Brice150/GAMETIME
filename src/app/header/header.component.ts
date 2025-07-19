import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { games } from 'src/assets/data/games';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  router = inject(Router);
  location = inject(Location);
  currentUrl = '';
  menuItems = [
    { path: '/', title: 'Accueil', icon: 'bx bxs-home' },
    { path: '/profil', title: 'Profil', icon: 'bx bxs-user' },
  ];
  @Output() logoutEvent = new EventEmitter<void>();

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  getTitle(): string {
    const staticTitles = [
      { path: '/', title: 'Game Time' },
      { path: '/profil', title: 'Profil' },
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
}
