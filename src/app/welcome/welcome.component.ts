import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlayerService } from '../core/services/player.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { UserService } from '../core/services/user.service';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements AfterViewInit {
  imagePath: string = environment.imagePath;
  userService = inject(UserService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  loading: boolean = false;
  @ViewChildren('feature') features!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const relativeDelay = index * 0.2;
            element.style.transitionDelay = `${relativeDelay}s`;
            element.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    this.features.forEach((feature) => {
      observer.observe(feature.nativeElement);
    });
  }

  continueWithGoogle(): void {
    this.loading = true;
    this.userService
      .signInWithGoogle()
      .pipe(
        switchMap(() => this.playerService.addPlayer()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (email) => {
          this.loading = false;
          this.userService.currentUserSig.set({
            email: email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.router.navigate(['/accueil']);
          this.toastrHelper.info('Bienvenue sur Game Time', 'Game Time');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (
            !error.message.includes('Missing or insufficient permissions.') &&
            !error.message.includes('auth/popup-closed-by-user')
          ) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  continueWithGithub(): void {
    this.loading = true;
    this.userService
      .signInWithGithub()
      .pipe(
        switchMap(() => this.playerService.addPlayer()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (email) => {
          this.loading = false;
          this.userService.currentUserSig.set({
            email: email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.router.navigate(['/accueil']);
          this.toastrHelper.info('Bienvenue sur Game Time', 'Game Time');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (
            !error.message.includes('Missing or insufficient permissions.') &&
            !error.message.includes('auth/popup-closed-by-user')
          ) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  continueAsGuest(): void {
    this.loading = true;
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
          this.loading = false;
          this.userService.currentUserSig.set({
            email: 'Compte invité',
            isAnonymous,
          });
          this.router.navigate(['/accueil']);
          this.toastrHelper.info(
            'Connecté en invité. Tu pourras lier ton compte plus tard.',
            'Mode invité',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }
}
