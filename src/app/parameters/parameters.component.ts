import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { catchError, filter, map, of, switchMap, take } from 'rxjs';
import { FriendService } from '../core/services/friend.service';
import { PlayerService } from '../core/services/player.service';
import { ProfileService } from '../core/services/profile.service';
import { RoomService } from '../core/services/room.service';
import { UserService } from '../core/services/user.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { FriendsComponent } from './friends/friends.component';
import { NotificationsCardComponent } from './notifications-card/notifications-card.component';
import { UserComponent } from './user/user.component';
import { UserDialogComponent } from '../shared/components/user-dialog/user-dialog.component';
import { Player } from '../core/interfaces/player';

@Component({
  selector: 'app-parameters',
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    UserComponent,
    FriendsComponent,
    NotificationsCardComponent,
  ],
  templateUrl: './parameters.component.html',
  styleUrl: './parameters.component.css',
})
export class ParametersComponent {
  toastrHelper = inject(ToastrHelperService);
  profileService = inject(ProfileService);
  userService = inject(UserService);
  playerService = inject(PlayerService);
  roomService = inject(RoomService);
  friendService = inject(FriendService);
  dialog = inject(MatDialog);
  router = inject(Router);
  destroyRef = inject(DestroyRef);
  loading = false;
  tab: 'compte' | 'amis' = 'compte';

  get pendingRequestsNumber(): number {
    return this.playerService.currentPlayerSig()?.friendRequestIds?.length ?? 0;
  }

  isTemporaryAccount(): boolean {
    return !!this.userService.auth.currentUser?.isAnonymous;
  }

  isUsernameTaken(players: Player[], username: string): boolean {
    const currentUserId = this.playerService.currentPlayerSig()?.userId;
    const normalized = this.friendService.normalizeText(username);

    return players.some(
      (player) =>
        player.userId !== currentUserId &&
        this.friendService.normalizeText(player.username) === normalized,
    );
  }

  openUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: this.playerService.currentPlayerSig()!,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap((formValue: Player) => {
          this.loading = true;
          // Le pseudo est la clé de recherche des amis : deux homonymes le
          // rendraient inutilisable.
          return this.playerService.getAllPlayers().pipe(
            take(1),
            map((players) => ({
              formValue,
              isTaken: this.isUsernameTaken(players, formValue.username),
            })),
          );
        }),
        switchMap(({ formValue, isTaken }) => {
          if (isTaken) {
            return of(true);
          }

          const player = this.playerService.currentPlayerSig()!;
          player.username = formValue.username;
          player.animal = formValue.animal;

          return this.playerService.updatePlayer(player).pipe(map(() => false));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (isTaken) => {
          this.loading = false;

          if (isTaken) {
            this.toastrHelper.error('Ce nom est déjà pris par un autre joueur');
            return;
          }

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
        takeUntilDestroyed(this.destroyRef),
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
