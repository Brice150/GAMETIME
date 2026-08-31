import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * Pilote le theme clair / sombre.
 *
 * Sans choix explicite, on suit `prefers-color-scheme` et on continue de
 * reagir aux changements systeme. Des que l'utilisateur bascule le theme, le
 * choix est memorise et prend le pas sur le systeme.
 *
 * Concretement, le service pose l'attribut `data-theme` sur
 * <html>, ce qui fige `color-scheme` et donc la branche retenue par les
 * `light-dark()` de la feuille de styles.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';
  private readonly darkQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  readonly theme = signal<Theme>('dark');

  constructor() {
    const stored = this.readStoredTheme();
    this.theme.set(stored ?? (this.darkQuery.matches ? 'dark' : 'light'));
    this.apply(this.theme());

    // Tant qu'aucun choix n'est memorise, on reste aligne sur le systeme.
    this.darkQuery.addEventListener('change', (event) => {
      if (!this.readStoredTheme()) {
        this.theme.set(event.matches ? 'dark' : 'light');
        this.apply(this.theme());
      }
    });
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.apply(next);

    try {
      localStorage.setItem(this.storageKey, next);
    } catch {
      // Stockage indisponible (navigation privee) : le theme reste valable
      // pour la session en cours.
    }
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }
}
