/**
 * Tire `count` elements au hasard sans repetition. La cle de deduplication
 * est la reponse attendue, pas l'element : deux pays de meme monnaie ne
 * doivent pas donner deux fois le meme mot a taper dans une partie.
 *
 * Le nombre d'essais est borne : sur un vivier plus petit que `count`, la
 * boucle rendrait la main sans cette limite.
 */
export function pickRandom<T>(
  pool: T[],
  count: number,
  keyOf: (item: T) => string,
): T[] {
  const picked: T[] = [];
  const used = new Set<string>();

  if (!pool.length) {
    return picked;
  }

  let attempts = 0;

  while (picked.length < count && attempts < 1000) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    const key = keyOf(candidate);

    if (!used.has(key)) {
      used.add(key);
      picked.push(candidate);
    }

    attempts++;
  }

  return picked;
}
