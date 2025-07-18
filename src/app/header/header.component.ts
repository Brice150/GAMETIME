import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  router = inject(Router);
  location = inject(Location);
  @Output() logoutEvent = new EventEmitter<void>();

  menuItems = [
    { path: '/', title: 'Accueil', icon: 'bx bxs-home' },
    { path: '/profile', title: 'Profil', icon: 'bx bxs-user' },
  ];

  getTitle(): string {
    if (this.router.url === '/') {
      return 'Game Time';
    } else if (this.router.url.startsWith('/profile')) {
      return 'Profil';
    } else if (this.router.url.startsWith('/motus')) {
      return 'Motus';
    } else if (this.router.url.startsWith('/flag')) {
      return 'Drapeau';
    }
    return '';
  }

  isHomePage(): boolean {
    return this.router.url === '/';
  }

  back(): void {
    this.location.back();
  }

  logout(): void {
    this.logoutEvent.emit();
  }
}
