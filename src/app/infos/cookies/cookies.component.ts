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
  selector: 'app-cookies',
  imports: [RouterLink],
  templateUrl: './cookies.component.html',
  styleUrl: '../legal-text.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesComponent {
  consent = inject(ConsentService);
  readonly enterprise = input.required<Enterprise>();
}
