import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'system' | Theme;

export interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  icon: string;
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  { value: 'system', label: 'Système', icon: 'bx-desktop' },
  { value: 'light', label: 'Clair', icon: 'bxs-sun' },
  { value: 'dark', label: 'Sombre', icon: 'bxs-moon' },
];

/**
 * Pilote le theme clair / sombre.
 *
 * Par defaut le mode est « Systeme » : on suit `prefers-color-scheme` et ses
 * changements. L'utilisateur peut ensuite imposer « Clair » ou « Sombre »,
 * choix memorise sur l'appareil, ou revenir au systeme.
 *
 * Concretement, un choix explicite pose l'attribut `data-theme` sur <html>,
 * ce qui fige `color-scheme` et donc la branche retenue par les
 * `light-dark()` de la feuille de styles. En mode systeme l'attribut est
 * retire et le navigateur suit seul la preference de l'appareil.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';
  // Au prerendu il n'y a ni `matchMedia` ni theme memorise : la page est
  // produite en sombre, et le navigateur retablit le vrai theme des
  // l'hydratation, comme il le fait deja au premier rendu.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly darkQuery = this.isBrowser
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  private readonly systemTheme = signal<Theme>('dark');

  readonly mode = signal<ThemeMode>('system');
  readonly theme = computed<Theme>(() => {
    const mode = this.mode();
    return mode === 'system' ? this.systemTheme() : mode;
  });

  constructor() {
    if (!this.darkQuery) {
      return;
    }

    this.systemTheme.set(this.darkQuery.matches ? 'dark' : 'light');
    this.mode.set(this.readStoredMode());
    this.apply();

    this.darkQuery.addEventListener('change', (event) => {
      this.systemTheme.set(event.matches ? 'dark' : 'light');
    });
  }

  setMode(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    this.mode.set(mode);
    this.apply();

    try {
      if (mode === 'system') {
        localStorage.removeItem(this.storageKey);
      } else {
        localStorage.setItem(this.storageKey, mode);
      }
    } catch {
      // Stockage indisponible (navigation privee) : le theme reste valable
      // pour la session en cours.
    }
  }

  /** Raccourci de l'en-tete : impose l'inverse du theme affiche. */
  toggle(): void {
    this.setMode(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(): void {
    const mode = this.mode();

    if (mode === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
