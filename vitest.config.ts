import { defineConfig } from 'vitest/config';

/**
 * Le builder Angular lance Vitest avec `isolate: false`, pour retrouver le comportement de Karma
 * ou toute la suite partageait une page. Les fichiers se partagent alors un meme registre de
 * modules, et le `vi.mock` d'un fichier vaut pour tous les autres : les doublures du SDK Firebase
 * s'ecrasaient entre elles. Chaque fichier repart d'un registre neuf.
 */
export default defineConfig({
  test: {
    isolate: true,
  },
});
