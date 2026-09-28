import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../../core/services/consent.service';

@Component({
  selector: 'app-consent-banner',
  imports: [MatSlideToggleModule, RouterLink],
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentBannerComponent {
  consent = inject(ConsentService);
  readonly details = signal(false);
  // Brouillon du reglage fin : rien n'est enregistre avant validation.
  readonly adsDraft = signal(false);

  customize(): void {
    this.adsDraft.set(this.consent.choice()?.ads ?? false);
    this.details.set(true);
  }

  saveDetails(): void {
    this.consent.save(this.adsDraft());
    this.details.set(false);
  }

  acceptAll(): void {
    this.consent.acceptAll();
    this.details.set(false);
  }

  rejectAll(): void {
    this.consent.rejectAll();
    this.details.set(false);
  }

  close(): void {
    this.consent.closePreferences();
    this.details.set(false);
  }
}
