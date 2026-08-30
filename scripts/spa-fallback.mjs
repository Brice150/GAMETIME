import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// GitHub Pages ne sait pas réécrire les routes vers index.html : il sert
// 404.html. On en fait une copie de l'index pour que le routeur Angular
// prenne le relais sur les URLs profondes (/room/:id, /classement...).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = join(ROOT, "docs/index.html");
const FALLBACK = join(ROOT, "docs/404.html");

if (!existsSync(INDEX)) {
  console.error("docs/index.html introuvable : lancez d'abord le build.");
  process.exit(1);
}

copyFileSync(INDEX, FALLBACK);
console.log("docs/404.html : copie de docs/index.html");
