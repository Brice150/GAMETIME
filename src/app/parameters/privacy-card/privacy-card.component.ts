import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PlayerService } from '../../core/services/player.service';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';

@Component({
  selector: 'app-privacy-card',
  imports: [MatSlideToggleModule],
  templateUrl: './privacy-card.component.html',
  styleUrl: './privacy-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyCardComponent {
  playerService = inject(PlayerService);
  toastrHelper = inject(ToastrHelperService);
  destroyRef = inject(DestroyRef);

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
}
