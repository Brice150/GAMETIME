import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  effect,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  runInInjectionContext,
} from '@angular/core';
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
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { PlayerService } from '../core/services/player.service';
import { ProfileService } from '../core/services/profile.service';
import { RoomService } from '../core/services/room.service';
import { UserService } from '../core/services/user.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';

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
  roomService = inject(RoomService);
  dialog = inject(MatDialog);
  router = inject(Router);
  injector = inject(Injector);
  hide: boolean = true;
  hideDuplicate: boolean = true;
  destroyed$ = new Subject<void>();
  loading: boolean = false;

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
        password: ['', [Validators.minLength(6), Validators.maxLength(40)]],
        passwordConfirmation: [
          '',
          [Validators.minLength(6), Validators.maxLength(40)],
        ],
      },
      { validators: this.passwordMatchValidator }
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const player = this.playerService.currentPlayerSig();
        if (player?.username) {
          this.profileForm.patchValue({
            username: player.username,
          });
        }
      });
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
      const newPassword = this.profileForm.value.password;

      const usernameChanged =
        newUsername !== this.playerService.currentPlayerSig()?.username;
      const passwordChanged = !!newPassword && newPassword.trim().length > 0;

      let request$: Observable<any> = of(null);

      if (usernameChanged && passwordChanged) {
        request$ = this.profileService
          .updateProfile(this.profileForm.value)
          .pipe(
            switchMap(() =>
              this.playerService.updatePlayer({
                ...this.playerService.currentPlayerSig()!,
                username: newUsername,
              })
            )
          );
      } else if (passwordChanged) {
        request$ = this.profileService.updateProfile(this.profileForm.value);
      } else if (usernameChanged) {
        request$ = this.playerService.updatePlayer({
          ...this.playerService.currentPlayerSig()!,
          username: newUsername,
        });
      }

      request$.pipe(takeUntil(this.destroyed$)).subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('Profil modifié', 'Profil', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });

          if (usernameChanged) {
            const newPlayer = this.playerService.currentPlayerSig();
            if (newPlayer) {
              newPlayer.username = newUsername;
            }
            this.playerService.currentPlayerSig.set(newPlayer);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (error.message.includes('auth/requires-recent-login')) {
            this.toastr.info(
              'Merci de vous déconnecter et de vous reconnecter pour effectuer cette action',
              'Profil',
              {
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom error',
              }
            );
          } else {
            this.toastr.info(error.message, 'Profil', {
              positionClass: 'toast-top-center',
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
          return this.roomService.deleteUserRooms();
        }),
        switchMap(() => this.playerService.deleteUserPlayer()),
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
            positionClass: 'toast-top-center',
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
                positionClass: 'toast-top-center',
                toastClass: 'ngx-toastr custom error',
              }
            );
          } else {
            this.toastr.info(error.message, 'Profil', {
              positionClass: 'toast-top-center',
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
