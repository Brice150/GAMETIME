import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-results-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './results-details.component.html',
  styleUrls: ['./results-details.component.css'],
})
export class ResultsDetailsComponent implements OnInit {
  @Input() room!: Room;
  @Input() player!: Player;
  @Input() players: Player[] = [];

  otherPlayers: Player[] = [];
  selectedOther?: Player;

  ngOnInit(): void {
    this.otherPlayers = this.players.filter(
      (p) => p.userId !== this.player.userId
    );
    this.otherPlayers.sort((a, b) => a.userId!.localeCompare(b.userId!));

    if (this.otherPlayers.length) {
      this.selectedOther = this.otherPlayers[0];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const playersChange = changes['players'];
    if (!playersChange || playersChange.firstChange) return;

    const newPlayers: Player[] = playersChange.currentValue;

    if (newPlayers.length !== this.players.length) {
      this.otherPlayers = newPlayers.filter(
        (p) => p.userId !== this.player.userId
      );
      this.otherPlayers.sort((a, b) => a.userId!.localeCompare(b.userId!));

      const existing = this.selectedOther
        ? this.otherPlayers.find((p) => p.userId === this.selectedOther!.userId)
        : null;
      this.selectedOther = existing || this.otherPlayers[0];
    } else {
      this.otherPlayers.forEach((op) => {
        const updated = newPlayers.find((p) => p.userId === op.userId);
        if (updated) {
          Object.assign(op, updated);
        }
      });
    }
  }

  setOtherPlayer(userId: string) {
    const player = this.otherPlayers.find((p) => p.userId === userId);
    if (player) {
      this.selectedOther = player;
    }
  }
}
