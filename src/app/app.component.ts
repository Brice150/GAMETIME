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
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, of, switchMap, take } from 'rxjs';
import { ConsentService } from './core/services/consent.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { UserService } from './core/services/user.service';
import { HeaderComponent } from './header/header.component';
import { ConsentBannerComponent } from './shared/components/consent-banner/consent-banner.component';
import { InvitationsComponent } from './shared/components/invitations/invitations.component';
import { NotificationService } from './core/services/notification.service';
import { PlayerService } from './core/services/player.service';
import { ToastrHelperService } from './core/services/toastr-helper.service';

// Duree du fondu de l'ecran de chargement, alignee sur index.html.
export const SHELL_FADE_MS = 320;
// Filet de securite : si la session ne se resout jamais (reseau coupe),
// l'application finit par s'afficher.
export const SHELL_LOADER_TIMEOUT_MS = 8000;

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    InvitationsComponent,
    ConsentBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  userService = inject(UserService);
  playerService = inject(PlayerService);
  consentService = inject(ConsentService);
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

      const fallback = setTimeout(
        () => this.removeShellLoader(),
        SHELL_LOADER_TIMEOUT_MS,
      );
      this.destroyRef.onDestroy(() => clearTimeout(fallback));
    }

    this.userService.user$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((user) => {
          this.revealWhenSettled();

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
          this.revealWhenSettled();
          this.toastrHelper.handleError(error);
        },
      });
  }

  // L'écran de chargement inline (index.html) reste affiché tant que Firebase
  // n'a pas résolu la session, puis tant que le routeur n'a pas fini : un
  // joueur connecté est redirigé de la page d'accueil vers /accueil, et ne
  // doit pas l'apercevoir au passage.
  private revealWhenSettled(): void {
    if (!this.router.currentNavigation()) {
      this.removeShellLoader();
      return;
    }

    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      // Un tour plus tard : une redirection annule la navigation en cours et
      // n'en lance une autre qu'ensuite.
      .subscribe(() => setTimeout(() => this.revealWhenSettled()));
  }

  // Au prérendu, l'écran reste dans le HTML produit : la page ne s'affiche
  // qu'une fois la session connue. Le document est injecté plutôt que pris du
  // global, faute de `document` au prérendu. Dans le navigateur, l'écran
  // s'efface en fondu avant d'être retiré.
  removeShellLoader(): void {
    const loader = this.document.getElementById('app-shell-loader');

    if (!loader || !this.isBrowser) {
      return;
    }

    loader.classList.add('is-leaving');
    setTimeout(() => loader.remove(), SHELL_FADE_MS);
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
