import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../../core/services/consent.service';
import { LEGAL_DOCUMENTS } from '../../../infos/legal-documents';

@Component({
  selector: 'app-legal-footer',
  imports: [RouterLink],
  templateUrl: './legal-footer.component.html',
  styleUrl: './legal-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalFooterComponent {
  consent = inject(ConsentService);
  readonly documents = LEGAL_DOCUMENTS;
  readonly year = new Date().getFullYear();
}
