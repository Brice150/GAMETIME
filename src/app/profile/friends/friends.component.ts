import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { Player } from '../../core/interfaces/player';
import { FriendService } from '../../core/services/friend.service';
import { PlayerService } from '../../core/services/player.service';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';

@Component({
  selector: 'app-friends',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TotalMedalsNumberPipe,
  ],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnInit {
  playerService = inject(PlayerService);
  friendService = inject(FriendService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  loading = true;
  searchControl = new FormControl<string>('');
  private readonly allPlayers = signal<Player[]>([]);
  private readonly search = signal('');
  readonly maxResults = 20;

  readonly friends = computed(() => {
    const friendIds = this.playerService.currentPlayerSig()?.friendIds ?? [];
    return this.allPlayers()
      .filter((player) => !!player.userId && friendIds.includes(player.userId))
      .sort((a, b) => a.username.localeCompare(b.username));
  });

  readonly requests = computed(() => {
    const requestIds =
      this.playerService.currentPlayerSig()?.friendRequestIds ?? [];
    return this.allPlayers()
      .filter((player) => !!player.userId && requestIds.includes(player.userId))
      .sort((a, b) => a.username.localeCompare(b.username));
  });

  // Recherche cote client : la collection joueurs est deja ecoutee pour la
  // liste d'amis, un index Firestore supplementaire serait inutile.
  readonly results = computed(() => {
    const query = this.friendService.normalizeText(this.search());

    if (!query) {
      return [];
    }

    const currentUserId = this.playerService.currentPlayerSig()?.userId;

    return this.allPlayers()
      .filter(
        (player) =>
          player.userId !== currentUserId &&
          this.friendService.normalizeText(player.username).includes(query),
      )
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, this.maxResults);
  });

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.search.set(value ?? ''));

    this.playerService
      .getAllPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.allPlayers.set(players);
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastrHelper.error(error.message);
          }
        },
      });
  }

  isFriend(player: Player): boolean {
    return this.friendService.isFriend(player);
  }

  hasSentRequestTo(player: Player): boolean {
    return this.friendService.hasSentRequestTo(player);
  }

  hasRequestFrom(player: Player): boolean {
    return this.friendService.hasRequestFrom(player);
  }

  sendRequest(player: Player): void {
    const wasMutual = this.hasRequestFrom(player);

    this.run(this.friendService.sendRequest(player), () =>
      wasMutual
        ? `${player.username} est maintenant votre ami`
        : `Demande envoyée à ${player.username}`,
    );
  }

  cancelRequest(player: Player): void {
    this.run(this.friendService.cancelRequest(player), () => 'Demande annulée');
  }

  acceptRequest(player: Player): void {
    this.run(
      this.friendService.acceptRequest(player),
      () => `${player.username} est maintenant votre ami`,
    );
  }

  declineRequest(player: Player): void {
    this.run(
      this.friendService.declineRequest(player),
      () => 'Demande refusée',
    );
  }

  removeFriend(player: Player): void {
    this.run(
      this.friendService.removeFriend(player),
      () => `${player.username} a été retiré de vos amis`,
    );
  }

  private run(action$: Observable<void>, message: () => string): void {
    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.toastrHelper.info(message(), 'Amis'),
      error: (error: HttpErrorResponse) => {
        if (!error.message?.includes('Missing or insufficient permissions.')) {
          this.toastrHelper.error(error.message ?? 'Action impossible');
        }
      },
    });
  }
}
