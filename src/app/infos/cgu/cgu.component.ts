import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Enterprise } from '../../core/interfaces/enterprise';

@Component({
  selector: 'app-cgu',
  imports: [RouterLink],
  templateUrl: './cgu.component.html',
  styleUrl: '../legal-text.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CguComponent {
  readonly enterprise = input.required<Enterprise>();
}
