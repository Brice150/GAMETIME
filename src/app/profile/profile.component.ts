import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  catchError,
  filter,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { ProfileService } from '../core/services/profile.service';
import { UserService } from '../core/services/user.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PlayerService } from '../core/services/player.service';
import { Player } from '../core/interfaces/player';

@Component({
  selector: 'app-profil',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  toastr = inject(ToastrService);
  fb = inject(FormBuilder);
  profileService = inject(ProfileService);
  userService = inject(UserService);
  playerService = inject(PlayerService);
  dialog = inject(MatDialog);
  router = inject(Router);
  hide: boolean = true;
  hideDuplicate: boolean = true;
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  player: Player = {} as Player;

  ngOnInit(): void {
    this.profileForm = this.fb.group(
      {
        email: [
          {
            value: this.userService.currentUserSig()?.email || '',
            disabled: true,
          },
        ],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(40),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(40),
          ],
        ],
        passwordConfirmation: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(40),
          ],
        ],
      },
      { validators: this.passwordMatchValidator }
    );

    this.playerService
      .getPlayers()
      .pipe(take(1), takeUntil(this.destroyed$))
      .subscribe({
        next: (players: Player[]) => {
          if (players?.length > 0) {
            this.player = players[0];
            this.profileForm.patchValue({
              username: players[0].username,
            });
          }
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      const newUsername = this.profileForm.value.username;
      const usernameChanged = newUsername !== this.player.username;

      this.profileService
        .updateProfile(this.profileForm.value)
        .pipe(
          switchMap(() => {
            if (usernameChanged) {
              return this.playerService.updatePlayer({
                ...this.player,
                username: newUsername,
              });
            }
            return of(null);
          }),
          takeUntil(this.destroyed$)
        )
        .subscribe({
          next: () => {
            this.loading = false;
            this.toastr.info('Profil modifié', 'Profil', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom info',
            });
            if (usernameChanged) {
              this.player.username = newUsername;
            }
          },
          error: (error: HttpErrorResponse) => {
            this.loading = false;
            if (error.message.includes('auth/requires-recent-login')) {
              this.toastr.info(
                'Merci de vous déconnecter et de vous reconnecter pour effectuer cette action',
                'Profil',
                {
                  positionClass: 'toast-bottom-center',
                  toastClass: 'ngx-toastr custom error',
                }
              );
            } else {
              this.toastr.info(error.message, 'Profil', {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              });
            }
          },
        });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer votre profil',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading = true;
          return this.playerService.deleteUserPlayer();
        }),
        switchMap(() =>
          this.profileService.deleteProfile().pipe(
            catchError(() => {
              return of(undefined);
            })
          )
        ),
        switchMap(() =>
          this.userService.logout().pipe(
            catchError(() => {
              return of(undefined);
            })
          )
        ),
        takeUntil(this.destroyed$)
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/connect']);
          this.toastr.info('Profil supprimé', 'Profil', {
            positionClass: 'toast-bottom-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (error.message.includes('auth/requires-recent-login')) {
            this.toastr.info(
              'Merci de vous déconnecter et de vous reconnecter pour effectuer cette action',
              'Profil',
              {
                positionClass: 'toast-bottom-center',
                toastClass: 'ngx-toastr custom error',
              }
            );
          } else {
            this.toastr.info(error.message, 'Profil', {
              positionClass: 'toast-bottom-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  passwordMatchValidator(control: AbstractControl): void {
    const password = control.get('password')?.value;
    const passwordConfirmation = control.get('passwordConfirmation')?.value;

    if (
      control.get('password')!.valid &&
      passwordConfirmation &&
      passwordConfirmation !== '' &&
      password !== passwordConfirmation &&
      !control.get('passwordConfirmation')!.hasError('minlength') &&
      !control.get('passwordConfirmation')!.hasError('maxlength')
    ) {
      control
        .get('passwordConfirmation')
        ?.setErrors({ passwordMismatch: true });
    }
  }
}
