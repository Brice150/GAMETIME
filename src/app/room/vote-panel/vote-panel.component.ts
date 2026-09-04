import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { KeyLabel } from '../../core/interfaces/key-label';
import { Player } from '../../core/interfaces/player';

// Le meme vote sert avant la premiere partie, ou il remplace le bouton
// « Pret », et entre deux manches sur la page des resultats.
@Component({
  selector: 'app-vote-panel',
  imports: [],
  templateUrl: './vote-panel.component.html',
  styleUrl: './vote-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotePanelComponent {
  players = input.required<Player[]>();
  options = input.required<KeyLabel[]>();
  heading = input('Et maintenant ?');
  currentPlayerId = input<string | undefined>(undefined);
  @Output() voteEvent = new EventEmitter<string>();

  readonly myVote = computed(
    () =>
      this.players().find((player) => player.userId === this.currentPlayerId())
        ?.vote ?? null,
  );

  // Seuls les votes exprimes sont affiches : le report des joueurs muets sur
  // « Peu importe » ne sert qu'au depouillement, cote hote.
  readonly voteCounts = computed(() => {
    const counts: Record<string, number> = {};

    for (const player of this.players()) {
      if (player.vote) {
        counts[player.vote] = (counts[player.vote] ?? 0) + 1;
      }
    }

    return counts;
  });

  readonly votedCount = computed(
    () => this.players().filter((player) => !!player.vote).length,
  );

  vote(choice: string): void {
    this.voteEvent.emit(choice);
  }
}
