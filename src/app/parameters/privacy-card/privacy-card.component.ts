import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../core/services/consent.service';
import { GameApiService } from '../../core/services/game-api.service';
import { PlayerService } from '../../core/services/player.service';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';

@Component({
  selector: 'app-privacy-card',
  imports: [MatSlideToggleModule, RouterLink],
  templateUrl: './privacy-card.component.html',
  styleUrl: './privacy-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyCardComponent {
  playerService = inject(PlayerService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);
  gameApi = inject(GameApiService);
  consent = inject(ConsentService);
  private readonly document = inject(DOCUMENT);
  readonly exporting = signal(false);

  // Champ absent sur les fiches anterieures au reglage : traite comme actif.
  readonly shareActivity = computed(
    () => this.playerService.currentPlayerSig()?.shareActivity !== false,
  );

  toggle(checked: boolean): void {
    const player = this.playerService.currentPlayerSig();

    if (!player) {
      return;
    }

    player.shareActivity = checked;
    this.playerService.currentPlayerSig.set({ ...player });

    this.playerService
      .updatePlayerFields(player.id, { shareActivity: checked })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: HttpErrorResponse) => {
          player.shareActivity = !checked;
          this.playerService.currentPlayerSig.set({ ...player });
          this.toastrHelper.handleError(error);
        },
      });
  }

  // Droit d'acces et a la portabilite : le serveur rassemble tout ce qui
  // concerne le compte, y compris ce que le client ne peut pas lire.
  exportData(): void {
    this.exporting.set(true);

    this.gameApi
      .exportMyData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.exporting.set(false);
          this.download(data);
        },
        error: (error: HttpErrorResponse) => {
          this.exporting.set(false);
          this.toastrHelper.handleError(error);
        },
      });
  }

  private download(data: Record<string, unknown>): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `game-time-mes-donnees-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
