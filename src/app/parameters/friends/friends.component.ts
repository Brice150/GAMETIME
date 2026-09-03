import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { Player } from '../../core/interfaces/player';
import { FriendService } from '../../core/services/friend.service';
import { Room } from '../../core/interfaces/room';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsComponent implements OnInit {
  playerService = inject(PlayerService);
  friendService = inject(FriendService);
  toastrHelper = inject(ToastrHelperService);
  roomService = inject(RoomService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  readonly loading = signal(true);
  searchControl = new FormControl<string>('');
  private readonly allPlayers = signal<Player[]>([]);
  private readonly search = signal('');
  // Room en cours par identifiant d ami : sans ca, personne ne sait jamais
  // que quelqu un vient de lancer une partie.
  private readonly roomsByFriend = signal<Record<string, Room>>({});
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

    this.watchFriendRooms();

    this.playerService
      .getAllPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.allPlayers.set(players);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  roomOf(player: Player): Room | undefined {
    // Reglage de confidentialite du joueur concerne, pas du notre.
    if (!player.userId || player.shareActivity === false) {
      return undefined;
    }

    return this.roomsByFriend()[player.userId];
  }

  joinRoom(room: Room): void {
    this.localStorageService.newGame(room.id!);
    this.router.navigate(['/room', room.id!]);
  }

  private watchFriendRooms(): void {
    // `ngOnInit` n est pas un contexte d injection : sans cet injecteur,
    // `toObservable` leve NG0203 a l ouverture de la page.
    toObservable(this.playerService.currentPlayerSig, {
      injector: this.injector,
    })
      .pipe(
        map((player) => player?.friendIds ?? []),
        distinctUntilChanged(
          (previous, current) =>
            previous.length === current.length &&
            previous.every((id, index) => id === current[index]),
        ),
        switchMap((friendIds) =>
          this.roomService.getRoomsForPlayers(friendIds),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rooms) => {
          const friendIds =
            this.playerService.currentPlayerSig()?.friendIds ?? [];
          const byFriend: Record<string, Room> = {};

          for (const room of rooms) {
            for (const userId of room.playerIds ?? []) {
              if (friendIds.includes(userId)) {
                byFriend[userId] = room;
              }
            }
          }

          this.roomsByFriend.set(byFriend);
        },
        // Purement indicatif : un echec ne doit pas casser la page.
        error: () => undefined,
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
