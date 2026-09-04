import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  Output,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstGameVoteOptions } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';
import { TotalMedalsNumberPipe } from '../../shared/pipes/total-medals-number.pipe';
import { VotePanelComponent } from '../vote-panel/vote-panel.component';

@Component({
  selector: 'app-waiting-room',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TotalMedalsNumberPipe,
    VotePanelComponent,
  ],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingRoomComponent {
  toastrHelper = inject(ToastrHelperService);
  room = input.required<Room>();
  player = input.required<Player>();
  players = input.required<Player[]>();
  @Output() deleteEvent = new EventEmitter<Player>();
  @Output() voteEvent = new EventEmitter<string>();
  voteOptions = firstGameVoteOptions;

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
