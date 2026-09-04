import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import {
  concatMap,
  filter,
  from,
  map,
  Observable,
  switchMap,
  toArray,
} from 'rxjs';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { normalizeUsername } from '../core/utils/username.util';
import { LocalStorageService } from '../core/services/local-storage.service';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ToastrHelperService } from '../core/services/toastr-helper.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UserAdminDialogComponent } from '../shared/components/user-admin-dialog/user-admin-dialog.component';
import { PlayerCardComponent } from './player-card/player-card.component';
import { RoomsCardComponent } from './rooms-card/rooms-card.component';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    RoomsCardComponent,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    PlayerCardComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  localStorageService = inject(LocalStorageService);
  destroyRef = inject(DestroyRef);
  toastrHelper = inject(ToastrHelperService);
  dialog = inject(MatDialog);
  router = inject(Router);
  readonly rooms = signal<Room[]>([]);
  readonly players = signal<Player[]>([]);
  readonly playersByRoom = signal<Record<string, Player[]>>({});
  readonly loading = signal(true);
  playerSearchControl = new FormControl<string>('');
  private readonly search = signal('');
  readonly staleRoomMaxAgeMs = 24 * 60 * 60 * 1000;

  readonly startedRoomsNumber = computed(
    () => this.rooms().filter((room) => room.isStarted).length,
  );

  readonly waitingRoomsNumber = computed(
    () => this.rooms().length - this.startedRoomsNumber(),
  );

  ngOnInit(): void {
    this.playerSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.search.set(value ?? ''));

    this.roomService
      .getRooms()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((rooms) =>
          this.playerService.getAllPlayers().pipe(
            filter((players) => players.length > 1),
            map((players) => ({ rooms, players })),
          ),
        ),
      )
      .subscribe({
        next: ({ rooms, players }) => {
          this.rooms.set(this.sortRooms(rooms));
          this.players.set(this.sortPlayers(players));

          this.playersByRoom.set(
            rooms.reduce(
              (acc, room) => {
                const playerIds = room.playerIds || [];
                acc[room.id!] = playerIds
                  .map((id) => players.find((p) => p.userId === id))
                  .filter((p): p is Player => !!p);
                return acc;
              },
              {} as Record<string, Player[]>,
            ),
          );

          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  deleteRoom(roomId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer cette room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading.set(true);
          return this.cleanupRoom(roomId);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastrHelper.info('La room a été supprimée', 'Room');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error, true);
        },
      });
  }

  // Une room dont l'hote a ferme l'onglet n'est supprimee par personne :
  // faute de tache planifiee, le menage est declenche depuis cette page.
  readonly staleRooms = computed(() =>
    this.rooms().filter((room) =>
      this.roomService.isStale(room, this.staleRoomMaxAgeMs),
    ),
  );

  purgeStaleRooms(): void {
    const staleRooms = this.staleRooms();

    if (!staleRooms.length) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `supprimer les ${staleRooms.length} rooms inactives`,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading.set(true);
          return from(staleRooms).pipe(
            concatMap((room) => this.cleanupRoom(room.id!)),
            toArray(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastrHelper.info(
            `${staleRooms.length} rooms supprimées`,
            'Rooms',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastrHelper.handleError(error, true);
        },
      });
  }

  // Les joueurs bloques sur un resultat et les invitations mortes sont remis
  // a plat par la fonction `onRoomDeleted`. Les reecrire ici en plus doublait
  // l'attente, et un joueur qui n'est pas dans la room de l'admin faisait
  // refuser l'ecriture par les regles : la room ne partait pas.
  private cleanupRoom(roomId: string): Observable<void> {
    return this.roomService.deleteRoom(roomId);
  }

  openUserDialog(player: Player): void {
    const dialogRef = this.dialog.open(UserAdminDialogComponent, {
      data: player,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap((player: Player) => {
          return this.playerService.updatePlayer(player);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastrHelper.info('Joueur modifié', 'Joueur');
        },
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error, true);
        },
      });
  }

  // L'admin rejoint la room comme n'importe quel joueur : la page room
  // l'ajoute aux participants a l'ouverture.
  joinRoom(roomId: string): void {
    this.localStorageService.newGame(roomId);
    this.router.navigate(['/room', roomId]);
  }

  // Les parties en cours passent devant : c'est ce qu'un admin surveille.
  sortRooms(rooms: Room[]): Room[] {
    return [...rooms].sort((a, b) => {
      if (a.isStarted !== b.isStarted) {
        return a.isStarted ? -1 : 1;
      }

      return (b.playerIds?.length ?? 0) - (a.playerIds?.length ?? 0);
    });
  }

  sortPlayers(players: Player[]): Player[] {
    return [...players].sort((a, b) => {
      const aTotal =
        a.stats?.reduce((sum, stat) => sum + (stat.medalsNumber ?? 0), 0) ?? 0;
      const bTotal =
        b.stats?.reduce((sum, stat) => sum + (stat.medalsNumber ?? 0), 0) ?? 0;

      if (bTotal !== aTotal) {
        return bTotal - aTotal;
      }

      return a.username.localeCompare(b.username);
    });
  }

  readonly filteredPlayers = computed(() => {
    const normalizedQuery = normalizeUsername(this.search());

    if (!normalizedQuery) {
      return this.players();
    }

    return this.players().filter((player) =>
      normalizeUsername(player.username).includes(normalizedQuery),
    );
  });
}
