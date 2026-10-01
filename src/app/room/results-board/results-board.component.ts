import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { voteGroups } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { FlipDirective } from '../../shared/directives/flip.directive';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { currentRoundProgress, letterDots, lettersLabel } from '../letter-dots';
import { VotePanelComponent } from '../vote-panel/vote-panel.component';

// Etat d'un mot pour un joueur : trouve, rate, en train d'etre joue, ou pas
// encore atteint.
export type WordState = 'won' | 'lost' | 'current' | 'pending';

// Une carte par joueur, dans l'ordre du classement : son score, son temps ou
// la manche qu'il joue encore, et le verdict sur chaque mot.
@Component({
  selector: 'app-results-board',
  imports: [CommonModule, DurationPipe, FlipDirective, VotePanelComponent],
  templateUrl: './results-board.component.html',
  styleUrl: './results-board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Meme condition que le vote dans le gabarit : sur grand ecran, il passe
  // a droite des resultats.
  host: { '[class.with-vote]': 'canVote() && players().length > 1' },
})
export class ResultsBoardComponent {
  room = input.required<Room>();
  players = input.required<Player[]>();
  currentPlayerId = input<string | undefined>(undefined);
  canVote = input(false);
  readonly deleteEvent = output<Player>();
  readonly voteEvent = output<string>();

  voteGroups = voteGroups;

  // Les joueurs arrivent deja tries par la page room.
  readonly standings = computed(() => {
    const responses = this.room().responses ?? [];
    const total = responses.length;
    const currentPlayerId = this.currentPlayerId();

    return this.players().map((player, index) => {
      const progress = currentRoundProgress(player);
      const isSpectator = this.isSpectator(player);
      const played = player.currentRoomWins.length;

      return {
        player,
        rank: index + 1,
        wins: player.currentRoomWins.filter(Boolean).length,
        total,
        step: Math.min(played + 1, total),
        isSpectator,
        isMe: !!currentPlayerId && player.userId === currentPlayerId,
        lettersLabel: lettersLabel(progress),
        letterDots: letterDots(progress),
        words: responses.map((response, i) => ({
          response,
          state: this.wordState(player, i, isSpectator),
        })),
      };
    });
  });

  readonly isHost = computed(
    () =>
      !!this.currentPlayerId() && this.room().userId === this.currentPlayerId(),
  );

  isSpectator(player: Player): boolean {
    const startedPlayerIds = this.room().startedPlayerIds;

    return (
      !!startedPlayerIds?.length &&
      !!player.userId &&
      !startedPlayerIds.includes(player.userId) &&
      !!player.finishDate &&
      player.currentRoomWins.length === 0
    );
  }

  vote(choice: string): void {
    this.voteEvent.emit(choice);
  }

  delete(player: Player): void {
    this.deleteEvent.emit(player);
  }

  private wordState(
    player: Player,
    index: number,
    isSpectator: boolean,
  ): WordState {
    const won = player.currentRoomWins[index];

    if (won === true) {
      return 'won';
    }
    if (won === false) {
      return 'lost';
    }

    return !isSpectator &&
      !player.finishDate &&
      index === player.currentRoomWins.length
      ? 'current'
      : 'pending';
  }
}
