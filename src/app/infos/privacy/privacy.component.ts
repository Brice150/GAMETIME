import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Enterprise } from '../../core/interfaces/enterprise';
import { ConsentService } from '../../core/services/consent.service';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: '../legal-text.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  // Les passages sur la publicite suivent la configuration : la politique
  // decrit ce qui se passe reellement, pas ce qui pourrait se passer.
  consent = inject(ConsentService);
  readonly enterprise = input.required<Enterprise>();
}
