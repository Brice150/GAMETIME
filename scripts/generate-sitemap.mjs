import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE_URL = "https://game-time-64133.web.app";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Seule la page d'accueil est publique : tout le reste est derrière un garde
// d'authentification et n'aurait rien à montrer à un robot. Ces mêmes routes
// sont refusées dans robots.txt.
const INDEXED_ROUTES = [{ path: "", changefreq: "weekly" }];

// Routes pregenerees en plus de celles du sitemap, si un jour une page
// publique ne doit pas être indexée.
const EXTRA_PRERENDERED_ROUTES = [];

const lastmod = new Date().toISOString().slice(0, 10);

// La racine garde sa barre finale : c'est la forme du `link rel="canonical"`
// de index.html, et les deux doivent designer la meme URL.
const urls = INDEXED_ROUTES.map(
  ({ path, changefreq }) => `  <url>
    <loc>${BASE_URL}${path || "/"}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
  </url>`,
).join("\n\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>
`;

writeFileSync(join(ROOT, "src", "sitemap.xml"), xml, "utf8");

const prerenderRoutes = [
  ...INDEXED_ROUTES.map(({ path }) => path || "/"),
  ...EXTRA_PRERENDERED_ROUTES,
];

writeFileSync(
  join(ROOT, "prerender-routes.txt"),
  `${prerenderRoutes.join("\n")}\n`,
  "utf8",
);

console.log(
  `✓ sitemap.xml généré (${INDEXED_ROUTES.length} URL, lastmod=${lastmod})`,
);
console.log(
  `✓ prerender-routes.txt généré (${prerenderRoutes.length} route${prerenderRoutes.length > 1 ? "s" : ""})`,
);
