import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { AdService } from '../../../core/services/ad.service';

/**
 * Bloc publicitaire. Il n'occupe aucune place tant que la publicite est
 * desactivee, que son identifiant manque ou que le joueur a refuse.
 */
@Component({
  selector: 'app-ad-slot',
  templateUrl: './ad-slot.component.html',
  styleUrl: './ad-slot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdSlotComponent {
  adService = inject(AdService);
  readonly slot = input.required<string>();

  readonly visible = computed(() => this.adService.ready() && !!this.slot());

  constructor() {
    // Apres rendu : AdSense remplit un `<ins>` deja present dans la page.
    afterRenderEffect(() => {
      if (this.visible()) {
        this.adService.load();
        this.adService.fill();
      }
    });
  }
}
