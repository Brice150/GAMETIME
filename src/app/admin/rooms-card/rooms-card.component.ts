import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { gameMap } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';

// Vue de supervision : qui est dans quelle room. Les resultats de partie
// n'y figurent pas, ils appartiennent aux joueurs.
@Component({
  selector: 'app-rooms-card',
  imports: [CommonModule, TotalMedalsNumberPipe],
  templateUrl: './rooms-card.component.html',
  styleUrl: './rooms-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsCardComponent {
  rooms = input.required<Room[]>();
  playersByRoom = input.required<Record<string, Player[]>>();
  @Output() joinEvent = new EventEmitter<string>();
  @Output() deleteEvent = new EventEmitter<string>();

  roomPlayers(room: Room): Player[] {
    return this.playersByRoom()[room.id!] ?? [];
  }

  isHost(room: Room, player: Player): boolean {
    return !!player.userId && player.userId === room.userId;
  }

  // Tant que la room n'est pas lancee, `gameName` porte encore le code de la
  // room : il n'y a pas de jeu a afficher.
  stateLabel(room: Room): string {
    if (!room.isStarted) {
      return 'En attente';
    }

    return gameMap[room.gameName]?.label ?? room.gameName;
  }

  stateIcon(room: Room): string {
    if (!room.isStarted) {
      return 'bx bxs-time-five';
    }

    return gameMap[room.gameName]?.icon ?? 'bx bxs-error-alt';
  }

  join(roomId: string): void {
    this.joinEvent.emit(roomId);
  }

  delete(roomId: string): void {
    this.deleteEvent.emit(roomId);
  }
}
