import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { filter, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { Player } from '../core/interfaces/player';
import { Room } from '../core/interfaces/room';
import { PlayerService } from '../core/services/player.service';
import { RoomService } from '../core/services/room.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UserAdminDialogComponent } from '../shared/components/user-admin-dialog/user-admin-dialog.component';
import { PlayerCardComponent } from './player-card/player-card.component';
import { RoomCardComponent } from './room-card/room-card.component';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    RoomCardComponent,
    MatProgressSpinnerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PlayerCardComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  roomService = inject(RoomService);
  playerService = inject(PlayerService);
  destroyed$ = new Subject<void>();
  toastr = inject(ToastrService);
  dialog = inject(MatDialog);
  rooms: Room[] = [];
  players: Player[] = [];
  selectedPlayer?: Player;
  playersByRoom: Record<string, Player[]> = {};
  creatorByRoom: Record<string, Player> = {};
  loading: boolean = true;
  games = games;
  selectedRoomType?: string = 'attente';
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;

  ngOnInit(): void {
    this.roomService
      .getRooms()
      .pipe(
        takeUntil(this.destroyed$),
        switchMap((rooms) =>
          this.playerService.getAllPlayers().pipe(
            filter((players) => players.length > 1),
            map((players) => ({ rooms, players }))
          )
        )
      )
      .subscribe({
        next: ({ rooms, players }) => {
          this.rooms = rooms;
          this.players = this.sortPlayers(players);

          this.playersByRoom = rooms.reduce((acc, room) => {
            const playerIds = room.playerIds || [];
            acc[room.id!] = playerIds
              .map((id) => players.find((p) => p.userId === id))
              .filter((p): p is Player => !!p);
            return acc;
          }, {} as Record<string, Player[]>);

          this.creatorByRoom = rooms.reduce((acc, room) => {
            const creator = players.find((p) => p.userId === room.userId);
            if (creator) {
              acc[room.id!] = creator;
            }
            return acc;
          }, {} as Record<string, Player>);

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
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

  deleteRoom(roomId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'supprimer cette room',
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => {
          this.loading = true;

          if (!this.playersByRoom[roomId]?.length) {
            return of(null);
          }

          this.playersByRoom[roomId].forEach((player) => {
            player.currentRoomWins = [];
            player.finishDate = null;
            player.isReady = false;
          });

          return this.playerService.updatePlayers(this.playersByRoom[roomId]);
        }),
        takeUntil(this.destroyed$),
        switchMap(() => this.roomService.deleteRoom(roomId))
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('La room a été supprimée', 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  addRoom(): void {
    this.loading = true;

    const roomCode = this.roomService.generateRoomCode();

    const newRoom = {
      gameName: roomCode,
      playerIds: [] as string[],
      isStarted: false,
      startDate: null,
      startAgainNumber: 0,
      isCreatedByAdmin: true,
      isReadyNotificationActivated: false,
      roomCode: roomCode,
    };

    this.roomService
      .deleteUserRooms()
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => this.roomService.addRoom(newRoom as Room))
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.info('Room créée', 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (!error.message.includes('Missing or insufficient permissions.')) {
            this.toastr.error(error.message, 'Game Time', {
              positionClass: 'toast-top-center',
              toastClass: 'ngx-toastr custom error',
            });
          }
        },
      });
  }

  openUserDialog(): void {
    const dialogRef = this.dialog.open(UserAdminDialogComponent, {
      data: this.selectedPlayer,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap((player: Player) => {
          return this.playerService.updatePlayer(player);
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe({
        next: () => {
          this.toastr.info('Joueur modifié', 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom info',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.toastr.info(error.message, 'Admin', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          });
        },
      });
  }

  sortPlayers(players: Player[]): Player[] {
    const sortedPlayers = [...players].sort((a, b) =>
      a.username.localeCompare(b.username)
    );

    this.setSelectedPlayer(sortedPlayers);

    return sortedPlayers;
  }

  setSelectedPlayer(sortedPlayers: Player[]): void {
    if (this.selectedPlayer) {
      const matchingPlayer = sortedPlayers.find(
        (player) => player.userId === this.selectedPlayer!.userId
      );

      this.selectedPlayer = matchingPlayer ?? sortedPlayers[0];
    } else {
      this.selectedPlayer = sortedPlayers[0];
    }
  }

  canDisplayRoom(room: Room): boolean {
    if (this.selectedRoomType === 'attente') {
      return !room.isStarted;
    }

    return room.gameName === this.selectedRoomType;
  }

  canAddRoom(): boolean {
    return (
      this.selectedRoomType === 'attente' &&
      !this.rooms.some((room) => room.isCreatedByAdmin)
    );
  }
}
