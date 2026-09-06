/**
 * Comble ce que jsdom ne fournit pas.
 *
 * Les tests tournent sur jsdom, qui implémente le DOM mais pas les API liées à la mise en page :
 * la plateforme se déclare « navigateur », donc les gardes `isPlatformBrowser` du code laissent
 * passer, et l'appel échoue faute d'implémentation. On fournit le minimum pour que le composant
 * suive son chemin nominal, sans prétendre observer quoi que ce soit.
 */

/** Aucun élément n'est mis en page : rien ne peut être observé, et rien ne doit échouer. */
const ignore = (): void => undefined;

class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.rootMargin = options?.rootMargin ?? '';
  }

  observe = ignore;
  unobserve = ignore;
  disconnect = ignore;

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Laisse un test déclencher lui-même l'entrée dans le champ, s'il en a besoin. */
  trigger(entries: Partial<IntersectionObserverEntry>[]): void {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: ignore,
    removeEventListener: ignore,
    addListener: ignore,
    removeListener: ignore,
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

if (typeof globalThis.scrollTo === 'undefined') {
  globalThis.scrollTo = ignore as unknown as typeof globalThis.scrollTo;
}
