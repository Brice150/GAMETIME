/**
 * Le pseudo est la clé de recherche des amis : deux joueurs ne peuvent pas
 * porter le même, à la casse et aux accents près.
 */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Premier pseudo libre à partir de celui demandé, en numérotant la fin.
 * « Alex » pris propose « Alex2 », et « Alex2 » pris propose « Alex3 »
 * plutôt que « Alex22 ».
 */
export function suggestAvailableUsername(
  wanted: string,
  takenKeys: Set<string>,
): string {
  const base = wanted.trim();

  if (!takenKeys.has(normalizeUsername(base))) {
    return base;
  }

  const root = base.replace(/\d+$/, '') || base;

  for (let suffix = 2; suffix <= 999; suffix++) {
    const candidate = `${root}${suffix}`;

    if (!takenKeys.has(normalizeUsername(candidate))) {
      return candidate;
    }
  }

  return `${root}${Date.now().toString().slice(-4)}`;
}
