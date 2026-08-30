import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, relative } from "node:path";
import subsetFont from "subset-font";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SOURCE_CSS = join(ROOT, "node_modules/boxicons/css/boxicons.min.css");
const SOURCE_FONT = join(ROOT, "node_modules/boxicons/fonts/boxicons.ttf");
const OUTPUT_CSS = join(ROOT, "src/boxicons.css");
const OUTPUT_FONT = join(ROOT, "src/assets/fonts/boxicons-subset.woff2");

const SCANNED_EXTENSIONS = [".ts", ".html", ".css", ".json"];
const ICON_NAME = /\bbx[sl]?-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;
const ICON_RULE = /\.(bx[sl]?-[a-z0-9-]+):before\{content:"\\([0-9a-f]{4,5})"\}/g;
const FONT_FACE = /@font-face\{font-family:boxicons;[^}]*\}/;

// Le @font-face n'est pas écrit ici : il est déclaré en inline dans
// src/index.html pour permettre le <link rel="preload">, et parce qu'une url
// relative dans une feuille de style serait résolue au build par le bundler
// (le site est servi sous le sous-chemin /GAMETIME/).

function collectFiles(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) collectFiles(path, files);
    else if (SCANNED_EXTENSIONS.includes(extname(entry))) files.push(path);
  }

  return files;
}

const usedNames = new Set();

for (const file of collectFiles(join(ROOT, "src"))) {
  if (file === OUTPUT_CSS) continue;

  for (const match of readFileSync(file, "utf8").matchAll(ICON_NAME)) {
    usedNames.add(match[0]);
  }
}

const source = readFileSync(SOURCE_CSS, "utf8");

const definedIcons = new Map();
for (const [, name, codepoint] of source.matchAll(ICON_RULE)) {
  definedIcons.set(name, codepoint);
}

const keptIcons = [...usedNames].filter((name) => definedIcons.has(name));
const unknownIcons = [...usedNames].filter(
  (name) => !definedIcons.has(name) && name.startsWith("bxs-"),
);

if (unknownIcons.length) {
  console.warn(
    `Icônes introuvables dans Boxicons, elles ne s'afficheront pas : ${unknownIcons.join(", ")}`,
  );
}

const keptSet = new Set(keptIcons);

const css = source
  .replace(FONT_FACE, "")
  .replace(ICON_RULE, (rule, name) => (keptSet.has(name) ? rule : ""));

const characters = keptIcons
  .map((name) => String.fromCodePoint(parseInt(definedIcons.get(name), 16)))
  .join("");

const font = await subsetFont(readFileSync(SOURCE_FONT), characters, {
  targetFormat: "woff2",
});

writeFileSync(OUTPUT_CSS, `${css}\n`);
writeFileSync(OUTPUT_FONT, font);

const sourceFontSize = statSync(
  join(ROOT, "node_modules/boxicons/fonts/boxicons.woff2"),
).size;

const format = (bytes) => `${Math.round(bytes / 1024)} Ko`;

console.log(
  `${relative(ROOT, OUTPUT_FONT)} : ${keptIcons.length}/${definedIcons.size} icônes, ${format(sourceFontSize)} -> ${format(font.length)}`,
);
console.log(
  `${relative(ROOT, OUTPUT_CSS)} : ${format(Buffer.byteLength(source))} -> ${format(Buffer.byteLength(css))}`,
);
