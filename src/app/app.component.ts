import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { UserService } from './core/services/user.service';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, HeaderComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  userService = inject(UserService);
  router = inject(Router);
  logo: string = '';
  gameName: string = '';

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.getCurrentGame(event.urlAfterRedirects);
      }
    });
  }

  getCurrentGame(url?: string): void {
    const currentUrl = url || this.router.url;

    if (currentUrl.endsWith('/motus')) {
      this.logo = 'bx bxs-objects-horizontal-left';
      this.gameName = 'motus';
    } else if (currentUrl.endsWith('/flag')) {
      this.logo = 'bx bxs-flag';
      this.gameName = 'drapeau';
    }
  }

  isHomePage(): boolean {
    return this.router.url === '/';
  }
}
