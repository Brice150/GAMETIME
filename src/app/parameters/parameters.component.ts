import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
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
import { PrivacyCardComponent } from './privacy-card/privacy-card.component';
import { UserComponent } from './user/user.component';
import { UserDialogComponent } from '../shared/components/user-dialog/user-dialog.component';
import { Player } from '../core/interfaces/player';
import {
  normalizeUsername,
  suggestAvailableUsername,
} from '../core/utils/username.util';

@Component({
  selector: 'app-parameters',
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    UserComponent,
    FriendsComponent,
    NotificationsCardComponent,
    PrivacyCardComponent,
  ],
  templateUrl: './parameters.component.html',
  styleUrl: './parameters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly loading = signal(false);
  readonly tab = signal<'compte' | 'amis'>('compte');

  constructor() {
    // Lier un compte invite passe par la meme fenetre que la connexion :
    // elle a besoin de la meme avance.
    if (this.isTemporaryAccount()) {
      this.userService.warmUpSignInPopup();
    }
  }

  get pendingRequestsNumber(): number {
    return this.playerService.currentPlayerSig()?.friendRequestIds?.length ?? 0;
  }

  isTemporaryAccount(): boolean {
    return !!this.userService.auth.currentUser?.isAnonymous;
  }

  // Premier pseudo libre a partir de celui demande : `wanted` lui-meme s'il
  // est disponible.
  private availableUsername(players: Player[], wanted: string): string {
    const currentUserId = this.playerService.currentPlayerSig()?.userId;
    const takenKeys = new Set(
      players
        .filter((player) => player.userId !== currentUserId)
        .map((player) => normalizeUsername(player.username)),
    );

    return suggestAvailableUsername(wanted, takenKeys);
  }

  openUserDialog(prefilledUsername?: string): void {
    const currentPlayer = this.playerService.currentPlayerSig()!;

    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: prefilledUsername
        ? { ...currentPlayer, username: prefilledUsername }
        : currentPlayer,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap((formValue: Player) => {
          this.loading.set(true);
          // Le pseudo est la clé de recherche des amis : deux homonymes le
          // rendraient inutilisable.
          return this.playerService.getAllPlayers().pipe(
            take(1),
            map((players) => ({
              formValue,
              suggestion: this.availableUsername(players, formValue.username),
            })),
          );
        }),
        switchMap(({ formValue, suggestion }) => {
          if (
            normalizeUsername(suggestion) !==
            normalizeUsername(formValue.username)
          ) {
            return of(suggestion);
          }

          const player = this.playerService.currentPlayerSig()!;
          player.username = formValue.username;
          player.animal = formValue.animal;

          return this.playerService.updatePlayer(player).pipe(map(() => null));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (suggestion) => {
          this.loading.set(false);

          if (suggestion) {
            this.toastrHelper.error(
              `Ce nom est déjà pris. Essayez « ${suggestion} »`,
            );
            // Rouvrir prerempli evite de tout retaper.
            this.openUserDialog(suggestion);
            return;
          }

          this.toastrHelper.info('Profil modifié', 'Profil');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
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
          this.loading.set(true);
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
          this.loading.set(false);
          this.router.navigate(['/']);
          this.toastrHelper.info('Profil supprimé', 'Profil');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  linkTemporaryWithGoogle(): void {
    this.loading.set(true);
    this.userService
      .linkAnonymousAccountWithGoogle()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (userCredential) => {
          this.loading.set(false);
          this.userService.currentUserSig.set({
            email: userCredential.user.email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.toastrHelper.info('Compte lié avec Google', 'Compte');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  linkTemporaryWithGithub(): void {
    this.loading.set(true);
    this.userService
      .linkAnonymousAccountWithGithub()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (userCredential) => {
          this.loading.set(false);
          this.userService.currentUserSig.set({
            email: userCredential.user.email ?? 'Compte invité',
            isAnonymous: false,
          });
          this.toastrHelper.info('Compte lié avec GitHub', 'Compte');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }
}
