import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { voteGroups } from '../../../assets/data/games';
import { JoinChannel, Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';
import { FlipDirective } from '../../shared/directives/flip.directive';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';
import { VotePanelComponent } from '../vote-panel/vote-panel.component';

const ARRIVALS: Record<JoinChannel | 'host', { icon: string; label: string }> =
  {
    host: { icon: 'bxs-crown', label: 'hôte' },
    code: { icon: 'bxs-key', label: 'code' },
    link: { icon: 'bx-link', label: 'lien' },
    invitation: { icon: 'bxs-envelope', label: 'invitation' },
    friend: { icon: 'bxs-group', label: 'ami' },
  };

@Component({
  selector: 'app-waiting-room',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TotalMedalsNumberPipe,
    VotePanelComponent,
    FlipDirective,
  ],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Meme condition que le vote dans le gabarit : sur grand ecran, il passe
  // a droite des joueurs.
  host: { '[class.with-vote]': 'players().length > 1' },
})
export class WaitingRoomComponent {
  // L'hote a cree la room ; les autres disent par ou ils sont entres.
  arrival(player: Player): { icon: string; label: string } | null {
    if (player.userId === this.room().userId) {
      return ARRIVALS.host;
    }

    return player.joinedVia ? ARRIVALS[player.joinedVia] : null;
  }

  toastrHelper = inject(ToastrHelperService);
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
  readonly deleteEvent = output<Player>();
  readonly voteEvent = output<string>();
  voteGroups = voteGroups;

  copyCode(): void {
    navigator.clipboard.writeText(this.room().roomCode).then(() => {
      this.toastrHelper.info('Code de la partie copié', 'Code');
    });
  }

  vote(choice: string): void {
    this.voteEvent.emit(choice);
  }

  delete(player: Player): void {
    this.deleteEvent.emit(player);
  }
}
