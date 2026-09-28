import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Enterprise } from '../../core/interfaces/enterprise';

@Component({
  selector: 'app-mentions-legales',
  imports: [RouterLink],
  templateUrl: './mentions-legales.component.html',
  styleUrl: '../legal-text.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsLegalesComponent {
  readonly enterprise = input.required<Enterprise>();
}
