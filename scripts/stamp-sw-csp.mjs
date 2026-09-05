/**
 * Appose l'empreinte de la Content-Security-Policy en fin de `ngsw-worker.js`.
 *
 * La CSP qui s'applique a un service worker est celle capturee au moment de son
 * installation : elle est stockee dans l'enregistrement du worker, pas relue a
 * chaque demarrage. Or `ngsw-worker.js` est copie tel quel par le builder, donc
 * identique d'un deploiement a l'autre : le navigateur ne reinstalle jamais le
 * worker et conserve indefiniment l'ancienne politique. Une CSP corrigee ne
 * prendrait effet que sur les visiteurs n'ayant jamais installe la PWA.
 *
 * En marquant le fichier avec un hash de la CSP, toute modification de celle-ci
 * change le worker octet pour octet, ce qui declenche sa reinstallation et donc
 * la prise en compte de la nouvelle politique.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const WORKER = 'dist/game-time/browser/ngsw-worker.js';
const MARKER = /\n\/\/ csp-fingerprint: [0-9a-f]+\n?$/;

const csp = JSON.parse(readFileSync('firebase.json', 'utf8'))
  .hosting.headers.find((h) => h.source === '**')
  .headers.find((h) => h.key === 'Content-Security-Policy').value;

const fingerprint = createHash('sha256').update(csp).digest('hex').slice(0, 16);
const worker = readFileSync(WORKER, 'utf8').replace(MARKER, '');

writeFileSync(WORKER, `${worker}\n// csp-fingerprint: ${fingerprint}\n`);
console.log(`ngsw-worker.js marque avec csp-fingerprint: ${fingerprint}`);
