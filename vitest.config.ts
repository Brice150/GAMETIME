import { defineConfig } from 'vitest/config';

/**
 * Le builder Angular lance Vitest avec `isolate: false`, pour retrouver le comportement de Karma
 * ou toute la suite partageait une page. Les fichiers se partagent alors un meme registre de
 * modules : l'ordre de chargement decide de l'etat dans lequel un module est vu, et un `vi.mock`
 * vaut pour tous les fichiers, pas seulement le sien. Chaque fichier repart d'un registre neuf.
 */
export default defineConfig({
  test: {
    isolate: true,
  },
});
