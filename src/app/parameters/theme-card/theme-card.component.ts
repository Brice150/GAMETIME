import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  THEME_MODE_OPTIONS,
  ThemeService,
} from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-card',
  imports: [],
  templateUrl: './theme-card.component.html',
  styleUrl: './theme-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeCardComponent {
  themeService = inject(ThemeService);
  readonly options = THEME_MODE_OPTIONS;
}
