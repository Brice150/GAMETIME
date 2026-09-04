import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { UserService } from './core/services/user.service';
import { HeaderComponent } from './header/header.component';
import { InvitationsComponent } from './shared/components/invitations/invitations.component';
import { NotificationService } from './core/services/notification.service';
import { PlayerService } from './core/services/player.service';
import { ToastrHelperService } from './core/services/toastr-helper.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, InvitationsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  userService = inject(UserService);
  playerService = inject(PlayerService);
  notificationService = inject(NotificationService);
  pwaUpdateService = inject(PwaUpdateService);
  pwaInstallService = inject(PwaInstallService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    // Mise a jour et installation ne concernent qu'un vrai navigateur ; au
    // prerendu, l'ecoute de session ne rendra jamais de compte connecte, et la
    // page produite est donc celle d'un visiteur anonyme.
    if (this.isBrowser) {
      this.pwaUpdateService.init();
      this.pwaInstallService.init();
    }

    this.userService.user$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((user) => {
          this.removeShellLoader();

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

          // Les jetons FCM expirent : on les rafraichit a chaque ouverture,
          // sinon le push s'arrete silencieusement au bout de quelques
          // semaines.
          if (player) {
            void this.notificationService.initOnStartup();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.removeShellLoader();
          this.toastrHelper.handleError(error);
        },
      });
  }

  // L'écran de chargement inline (index.html) reste affiché tant que Firebase
  // n'a pas résolu la session : cela évite un écran vide, puis un saut de mise
  // en page au moment où le header apparaît.
  //
  // Le document est injecté plutôt que pris du global : au prérendu il n'y a
  // pas de `document`, et l'écran est ainsi retiré du HTML produit — la page
  // pregenerée n'a rien à masquer, son contenu est déjà là.
  removeShellLoader(): void {
    this.document.getElementById('app-shell-loader')?.remove();
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
          this.toastrHelper.handleError(error);
        },
      });
  }
}
