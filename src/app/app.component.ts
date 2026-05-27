import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { UserService } from './core/services/user.service';
import { HeaderComponent } from './header/header.component';
import { PlayerService } from './core/services/player.service';
import { ToastrHelperService } from './core/services/toastr-helper.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  userService = inject(UserService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.userService.user$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((user) => {
          if (user) {
            this.userService.currentUserSig.set({
              email: user.email ?? 'Compte invité',
              isAnonymous: user.isAnonymous,
            });
            return this.playerService.getPlayer();
          } else {
            this.userService.currentUserSig.set(null);
            return of([]);
          }
        }),
      )
      .subscribe({
        next: (players) => {
          const player = players[0];
          this.playerService.currentPlayerSig.set(player ?? null);
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  logout(): void {
    this.userService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.toastrHelper.info('Vous avez été déconnecté', 'Déconnexion');
        },
        error: (error: HttpErrorResponse) => {
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }
}
