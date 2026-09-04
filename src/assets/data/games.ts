import {
  GameDefinition,
  GameDrawOptions,
  GameRound,
} from '../../app/core/interfaces/game';
import { KeyLabel } from '../../app/core/interfaces/key-label';
import { BrandCategory } from '../../app/core/enums/brand-category.enum';
import { Continent } from '../../app/core/enums/continent.enum';
import { ElementFamily } from '../../app/core/enums/element-family.enum';
import { Brand } from '../../app/core/interfaces/brand';
import { ChemicalElement } from '../../app/core/interfaces/chemical-element';
import { Country } from '../../app/core/interfaces/country';
import { pickRandom } from '../../app/core/utils/draw.util';
import { brandLogoUrl, flagUrl } from '../../app/core/utils/media.util';

// Les jeux de donnees pesent quelques centaines de kilo-octets et ne servent
// qu'a la generation d'une partie : ils sont importes a la demande, et gardes
// en memoire pour les parties suivantes.
let countriesCache: Country[] | undefined;
let brandsCache: Brand[] | undefined;
let elementsCache: ChemicalElement[] | undefined;
let wordsByLengthCache: Map<number, string[]> | undefined;

async function loadCountries(): Promise<Country[]> {
  countriesCache ??= (await import('./countries')).countries;
  return countriesCache;
}

async function loadBrands(): Promise<Brand[]> {
  brandsCache ??= (await import('./brands')).brands;
  return brandsCache;
}

async function loadElements(): Promise<ChemicalElement[]> {
  elementsCache ??= (await import('./elements')).elements;
  return elementsCache;
}

// Indexe une fois par longueur : un tirage refiltrait sinon les 19 000 mots.
async function loadWordsByLength(): Promise<Map<number, string[]>> {
  if (!wordsByLengthCache) {
    const { words } = await import('./words');
    const byLength = new Map<number, string[]>();

    for (const word of words) {
      const pool = byLength.get(word.length);
      if (pool) {
        pool.push(word);
      } else {
        byLength.set(word.length, [word]);
      }
    }

    wordsByLengthCache = byLength;
  }

  return wordsByLengthCache;
}

function longestPool(
  wordsByLength: Map<number, string[]>,
): string[] | undefined {
  const longest = Math.max(...wordsByLength.keys());
  return wordsByLength.get(longest);
}

// Mots distincts pour une partie, de la longueur demandee. Motus les fait
// deviner sans indice, Anagrammes en montre les lettres melangees.
async function drawWords({
  stepsNumber,
  isWordLengthIncreasing,
  startWordLength,
}: GameDrawOptions): Promise<string[]> {
  const wordsByLength = await loadWordsByLength();
  const words: string[] = [];
  const used = new Set<string>();

  let attempts = 0;

  while (words.length < stepsNumber && attempts < 1000) {
    const length = isWordLengthIncreasing
      ? startWordLength + words.length
      : startWordLength;

    // Repli sur la plus grande longueur disponible : sortir de la boucle
    // rendait une partie plus courte que celle demandee.
    const pool = wordsByLength.get(length) ?? longestPool(wordsByLength);

    if (!pool?.length) {
      break;
    }

    const word = pool[Math.floor(Math.random() * pool.length)];

    if (!used.has(word)) {
      used.add(word);
      words.push(word);
    }

    attempts++;
  }

  return words;
}

/**
 * Lettres d'un mot dans le desordre, espacees pour rester lisibles. Un
 * melange qui redonnerait le mot d'origine n'aurait rien a deviner : il est
 * rejoue. Les mots faisant cinq lettres au minimum, l'echec repete n'est pas
 * un cas a traiter.
 */
function shuffleLetters(word: string): string {
  const letters = [...word.toUpperCase()];

  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    if (letters.join('') !== word.toUpperCase()) {
      break;
    }
  }

  return letters.join(' ');
}

// Tirage commun aux jeux batis sur les pays : d'un jeu a l'autre, seuls
// l'enonce et la reponse changent. Les pays auxquels la donnee manque sont
// ecartes du vivier.
async function drawCountries(
  stepsNumber: number,
  categoryFilter: number,
  toRound: (country: Country) => GameRound,
): Promise<GameRound[]> {
  const countries = await loadCountries();
  const pool = countries.filter(
    (country) =>
      !!toRound(country).response &&
      (categoryFilter === Continent.Monde ||
        country.continent === categoryFilter),
  );

  return pickRandom(
    pool,
    stepsNumber,
    (country) => toRound(country).response,
  ).map(toRound);
}

/**
 * Jeu bati sur un attribut de pays : le nom du pays sert d'enonce, l'attribut
 * de reponse. Un pays dont l'attribut vaut son propre nom est ecarte, l'enonce
 * donnant sinon la reponse.
 */
function countryAttributeGame(
  key: string,
  label: string,
  icon: string,
  attributeOf: (country: Country) => string | undefined,
): GameDefinition {
  return {
    key,
    label,
    icon,
    categoryKey: 'geographie',
    filterLabels: continentLabels,
    load: loadCountries,
    draw: ({ stepsNumber, categoryFilter }) =>
      drawCountries(stepsNumber, categoryFilter, (country) => ({
        response:
          attributeOf(country) === country.name
            ? ''
            : (attributeOf(country) ?? ''),
        prompt: country.name,
        media: flagUrl(country.code),
      })),
  };
}

// Les libelles doublent volontairement les enumerations : celles-ci nomment
// des identifiants, sans accent, et servent a typer les donnees.
const continentLabels = [
  'Monde',
  'Europe',
  'Asie',
  'Afrique',
  'Amérique',
  'Océanie',
];

const brandCategoryLabels = ['Tout', 'Voitures', 'Digital', 'Mode', 'Aliments'];

const elementFamilyLabels = [
  'Tout',
  'Métaux',
  'Non-métaux',
  'Halogènes',
  'Gaz nobles',
  'Terres rares',
];

// Trois categories pour sept jeux : en dessous de deux ou trois jeux par
// groupe, l'intitule coute une ligne pour n'annoncer qu'une pastille. Les
// sciences ressortiront a part le jour ou elles auront de quoi remplir un
// groupe.
export const gameCategories: KeyLabel[] = [
  { key: 'mots', label: 'Mots', icon: 'bx bx-font' },
  { key: 'geographie', label: 'Géographie', icon: 'bx bxs-map-alt' },
  { key: 'culture', label: 'Culture', icon: 'bx bxs-star' },
];

export const games: GameDefinition[] = [
  {
    key: 'drapeaux',
    label: 'Drapeaux',
    icon: 'bx bxs-flag',
    categoryKey: 'geographie',
    filterLabels: continentLabels,
    load: loadCountries,
    draw: ({ stepsNumber, categoryFilter }) =>
      drawCountries(stepsNumber, categoryFilter, (country) => ({
        response: country.name,
        prompt: '',
        media: flagUrl(country.code),
      })),
  },
  {
    key: 'marques',
    label: 'Marques',
    icon: 'bx bxs-package',
    categoryKey: 'culture',
    filterLabels: brandCategoryLabels,
    load: loadBrands,
    draw: async ({ stepsNumber, categoryFilter }) => {
      const brands = await loadBrands();
      const pool = brands.filter(
        (brand) =>
          categoryFilter === BrandCategory.Tout ||
          brand.category === categoryFilter,
      );

      return pickRandom(pool, stepsNumber, (brand) => brand.name).map(
        (brand) => ({
          response: brand.name,
          prompt: '',
          media: brandLogoUrl(brand.website),
        }),
      );
    },
  },
  {
    key: 'motus',
    label: 'Motus',
    icon: 'bx bxs-objects-horizontal-left',
    categoryKey: 'mots',
    hasWordLength: true,
    showFirstLetter: true,
    load: loadWordsByLength,
    draw: async (options) =>
      (await drawWords(options)).map((word) => ({
        response: word,
        prompt: '',
        media: '',
      })),
  },
  {
    key: 'anagrammes',
    label: 'Anagrammes',
    icon: 'bx bx-shuffle',
    categoryKey: 'mots',
    hasWordLength: true,
    load: loadWordsByLength,
    draw: async (options) =>
      (await drawWords(options)).map((word) => ({
        response: word,
        prompt: shuffleLetters(word),
        media: '',
      })),
  },
  countryAttributeGame(
    'capitales',
    'Capitales',
    'bx bxs-landmark',
    (country) => country.capital,
  ),
  countryAttributeGame(
    'gentiles',
    'Gentilés',
    'bx bxs-user-voice',
    (country) => country.demonym,
  ),
  {
    key: 'elements',
    label: 'Éléments',
    icon: 'bx bx-atom',
    categoryKey: 'culture',
    filterLabels: elementFamilyLabels,
    load: loadElements,
    draw: async ({ stepsNumber, categoryFilter }) => {
      const elements = await loadElements();
      const pool = elements.filter(
        (element) =>
          categoryFilter === ElementFamily.Tout ||
          element.family === categoryFilter,
      );

      return pickRandom(pool, stepsNumber, (element) => element.name).map(
        (element) => ({
          response: element.name,
          prompt: element.symbol,
          media: '',
        }),
      );
    },
  },
];

export const gameMap = Object.fromEntries(
  games.map((game) => [game.key, game]),
);

// Jeux d'une categorie, dans l'ordre du catalogue. Les categories sans jeu
// sont ecartees : elles n'ont rien a proposer dans une liste deroulante.
export function gamesByCategory(): { category: KeyLabel; games: KeyLabel[] }[] {
  return gameCategories
    .map((category) => ({
      category,
      games: games.filter((game) => game.categoryKey === category.key),
    }))
    .filter((group) => group.games.length > 0);
}

// Bulletin d'indifference : il ne designe aucun jeu, il laisse l'hote
// choisir. C'est aussi la voix pretee a qui n'a pas vote.
export const anyGameVoteKey = 'peu-importe';

const anyGameVote: KeyLabel = {
  key: anyGameVoteKey,
  label: 'Peu importe',
  icon: 'bx bx-dots-horizontal-rounded',
};

// Ordre de reference du depouillement : une egalite designe toujours le meme
// gagnant, et « Peu importe », en dernier, ne l'emporte qu'a defaut.
export const voteOptions: KeyLabel[] = [...games, anyGameVote];

export const voteMap = Object.fromEntries(
  voteOptions.map((option) => [option.key, option]),
);

export interface VoteGroup {
  label: string;
  options: KeyLabel[];
}

/**
 * Bulletins ranges par categorie : a plat, la liste devient illisible a
 * mesure que les jeux se multiplient. Rejouer le meme jeu ne demande pas de
 * bulletin dedie, il suffit de voter pour lui : la fenetre de lancement
 * reprend de toute facon les reglages de la partie precedente.
 */
export const voteGroups: VoteGroup[] = [
  ...gamesByCategory().map((group) => ({
    label: group.category.label,
    options: group.games,
  })),
  { label: '', options: [anyGameVote] },
];
