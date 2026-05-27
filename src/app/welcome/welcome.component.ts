import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { map, Subject, switchMap, takeUntil } from 'rxjs';
import { PlayerService } from '../core/services/player.service';
import { UserService } from '../core/services/user.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-welcome',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit, OnDestroy, AfterViewInit {
  imagePath: string = environment.imagePath;
  emailForm!: FormGroup;
  isEmailLinkPending: boolean = false;
  fb = inject(FormBuilder);
  userService = inject(UserService);
  playerService = inject(PlayerService);
  router = inject(Router);
  toastrHelper = inject(ToastrHelperService);
  destroyed$ = new Subject<void>();
  loading: boolean = false;
  @ViewChildren('feature') features!: QueryList<ElementRef>;

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    const currentUrl = window.location.href;
    if (this.userService.isEmailSignInLink(currentUrl)) {
      this.isEmailLinkPending = true;
      const storedEmail = this.userService.getStoredEmailForSignIn();

      if (storedEmail) {
        this.emailForm.patchValue({ email: storedEmail });
        this.completeEmailSignIn(storedEmail);
      } else {
        this.toastrHelper.info(
          'Lien détecté. Renseigne ton email pour finaliser la connexion.',
          'Lien',
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

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

  continueWithEmail(): void {
    if (!this.emailForm.valid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.value.email as string;

    if (this.isEmailLinkPending) {
      this.completeEmailSignIn(email);
      return;
    }

    this.loading = true;
    this.userService
      .sendEmailSignInLink(email)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastrHelper.info(
            'Un lien de connexion vient d être envoyé par email.',
            'Lien',
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

  private completeEmailSignIn(email: string): void {
    this.loading = true;
    this.userService
      .completeEmailLinkSignIn(email, window.location.href)
      .pipe(
        switchMap((userCredential) =>
          this.playerService
            .addPlayer()
            .pipe(map(() => userCredential.user.email)),
        ),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: (connectedEmail) => {
          this.loading = false;
          this.userService.clearStoredEmailForSignIn();
          this.userService.currentUserSig.set({ email: connectedEmail! });
          this.router.navigate(['/accueil']);
          this.toastrHelper.info('Bienvenue sur Game Time', 'Game Time');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  continueWithGoogle(): void {
    this.loading = true;
    this.userService
      .signInWithGoogle()
      .pipe(
        switchMap(() => this.playerService.addPlayer()),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: (email) => {
          this.loading = false;
          this.userService.currentUserSig.set({ email: email! });
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
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: (email) => {
          this.loading = false;
          this.userService.currentUserSig.set({ email: email! });
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
}
