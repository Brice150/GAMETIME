import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { catchError, filter, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ExcludedQuestionsService } from '../core/services/excluded-questions.service';
import { PlayerService } from '../core/services/player.service';
import { ProfileService } from '../core/services/profile.service';
import { RoomService } from '../core/services/room.service';
import { UserService } from '../core/services/user.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UserComponent } from './user/user.component';
import { UserDialogComponent } from '../shared/components/user-dialog/user-dialog.component';
import { Player } from '../core/interfaces/player';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    UserComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnDestroy {
  toastrHelper = inject(ToastrHelperService);
  profileService = inject(ProfileService);
  userService = inject(UserService);
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  excludedQuestionsService = inject(ExcludedQuestionsService);
  dialog = inject(MatDialog);
  router = inject(Router);
  destroyed$ = new Subject<void>();
  loading: boolean = false;

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  isTemporaryAccount(): boolean {
    return !!this.userService.auth.currentUser?.isAnonymous;
  }

  openUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: this.playerService.currentPlayerSig()!,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap((player: Player) => {
          this.loading = true;
          this.playerService.currentPlayerSig()!.username = player.username;
          this.playerService.currentPlayerSig()!.animal = player.animal;
          return this.playerService.updatePlayer(
            this.playerService.currentPlayerSig()!,
          );
        }),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastrHelper.info('Profil modifié', 'Profil');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (error.message.includes('auth/requires-recent-login')) {
            this.toastrHelper.error(
              'Merci de vous déconnecter et de vous reconnecter pour effectuer cette action',
            );
          } else {
            this.toastrHelper.error(error.message);
          }
        },
      });
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
        switchMap(() =>
          this.excludedQuestionsService.deleteUserExcludedQuestions(),
        ),
        switchMap(() => this.playerService.deleteUserPlayer()),
        switchMap(() =>
          this.profileService.deleteProfile().pipe(
            catchError(() => {
              return of(undefined);
            }),
          ),
        ),
        switchMap(() =>
          this.userService.logout().pipe(
            catchError(() => {
              return of(undefined);
            }),
          ),
        ),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/']);
          this.toastrHelper.info('Profil supprimé', 'Profil');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (error.message.includes('auth/requires-recent-login')) {
            this.toastrHelper.error(
              'Merci de vous déconnecter et de vous reconnecter pour effectuer cette action',
            );
          } else {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  linkTemporaryWithGoogle(): void {
    this.loading = true;
    this.userService
      .linkAnonymousAccountWithGoogle()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (userCredential) => {
          this.loading = false;
          this.userService.currentUserSig.set({
            email: userCredential.user.email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.toastrHelper.info('Compte lié avec Google', 'Compte');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('auth/popup-closed-by-user')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  linkTemporaryWithGithub(): void {
    this.loading = true;
    this.userService
      .linkAnonymousAccountWithGithub()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (userCredential) => {
          this.loading = false;
          this.userService.currentUserSig.set({
            email: userCredential.user.email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.toastrHelper.info('Compte lié avec GitHub', 'Compte');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('auth/popup-closed-by-user')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }
}
