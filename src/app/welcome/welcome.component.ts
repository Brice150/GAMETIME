import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { UserCredential } from '@angular/fire/auth';
import { environment } from '../../environments/environment';
import { PlayerService } from '../core/services/player.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { UserService } from '../core/services/user.service';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, MatProgressSpinnerModule, ThemeToggleComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent implements OnInit, AfterViewInit {
  imagePath: string = environment.imagePath;
  userService = inject(UserService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly loading = signal(false);
  // Tous les blocs qui apparaissent au defilement, pas seulement les
  // fonctionnalites : bandeau de chiffres, titres de section, appel a
  // l'inscription.
  @ViewChildren('reveal') revealed!: QueryList<ElementRef>;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.userService.warmUpSignInPopup();
    }
  }

  // Au prerendu il n'y a ni defilement ni `IntersectionObserver` : les blocs
  // restent dans leur etat initial, et l'hydratation les revele normalement.
  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const relativeDelay = index * 0.2;
            // Variable et non `transition-delay` : pose en direct, le
            // decalage restait sur l'element une fois apparu et retardait
            // aussi ses transitions de survol. Les feuilles de style ne
            // l'appliquent qu'aux proprietes de l'apparition.
            element.style.setProperty('--reveal-delay', `${relativeDelay}s`);
            element.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    this.revealed.forEach((element) => {
      observer.observe(element.nativeElement);
    });
  }

  // Retour sur le lien demande avant la connexion (une room partagee, par
  // exemple), sinon accueil.
  navigateAfterLogin(): void {
    const redirectUrl = this.userService.redirectUrl;
    this.userService.redirectUrl = null;
    this.router.navigateByUrl(redirectUrl ?? '/accueil');
  }

  continueWithGoogle(): void {
    this.signIn(this.userService.signInWithGoogle());
  }

  continueWithGithub(): void {
    this.signIn(this.userService.signInWithGithub());
  }

  // Google et GitHub ne different que par le fournisseur.
  private signIn(credential$: Observable<UserCredential>): void {
    this.loading.set(true);
    credential$
      .pipe(
        switchMap(() => this.playerService.addPlayer()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (email) => {
          this.loading.set(false);
          this.userService.currentUserSig.set({
            email: email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.navigateAfterLogin();
          this.toastrHelper.info('Bienvenue sur Game Time', 'Game Time');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  continueAsGuest(): void {
    this.loading.set(true);
    this.userService
      .signInAsGuest()
      .pipe(
        switchMap((userCredential) =>
          this.playerService
            .addPlayer()
            .pipe(map(() => userCredential.user.isAnonymous)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (isAnonymous) => {
          this.loading.set(false);
          this.userService.currentUserSig.set({
            email: 'Compte invité',
            isAnonymous,
          });
          this.navigateAfterLogin();
          this.toastrHelper.info(
            'Connecté en invité. Tu pourras lier ton compte plus tard.',
            'Mode invité',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }
}
