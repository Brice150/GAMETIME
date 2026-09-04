import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { VoteGroup } from '../../../assets/data/games';
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
  groups = input.required<VoteGroup[]>();
  heading = input('Et maintenant ?');
  currentPlayerId = input<string | undefined>(undefined);
  hostId = input<string | undefined>(undefined);
  @Output() voteEvent = new EventEmitter<string>();

  // L'hote choisit le jeu dans la fenetre de lancement : lui donner en plus un
  // bulletin ne ferait que dupliquer cette decision. Il lit le depouillement.
  readonly voters = computed(() =>
    this.players().filter((player) => player.userId !== this.hostId()),
  );

  readonly canVote = computed(
    () => !!this.currentPlayerId() && this.currentPlayerId() !== this.hostId(),
  );

  readonly myVote = computed(
    () =>
      this.players().find((player) => player.userId === this.currentPlayerId())
        ?.vote ?? null,
  );

  // Seuls les votes exprimes sont affiches : le report des joueurs muets sur
  // « Peu importe » ne sert qu'au depouillement, cote hote.
  readonly voteCounts = computed(() => {
    const counts: Record<string, number> = {};

    for (const player of this.voters()) {
      if (player.vote) {
        counts[player.vote] = (counts[player.vote] ?? 0) + 1;
      }
    }

    return counts;
  });

  readonly votedCount = computed(
    () => this.voters().filter((player) => !!player.vote).length,
  );

  vote(choice: string): void {
    if (!this.canVote()) {
      return;
    }

    this.voteEvent.emit(choice);
  }
}
