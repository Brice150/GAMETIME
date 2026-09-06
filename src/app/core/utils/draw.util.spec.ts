import { describe, expect, it } from 'vitest';
import { pickRandom } from './draw.util';

const identity = (value: string): string => value;

describe('pickRandom', () => {
  it('tire le nombre demande sans repetition', () => {
    const picked = pickRandom(['a', 'b', 'c', 'd'], 3, identity);

    expect(picked.length).toBe(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('deduplique sur la reponse attendue, pas sur l element', () => {
    const pool = [
      { name: 'France', currency: 'Euro' },
      { name: 'Italie', currency: 'Euro' },
    ];

    // Deux pays, une seule monnaie : le mot a taper ne peut sortir deux fois.
    expect(pickRandom(pool, 2, (country) => country.currency).length).toBe(1);
  });

  it('rend la main sur un vivier vide', () => {
    expect(pickRandom([], 3, identity)).toEqual([]);
  });

  it('se contente de ce que le vivier contient', () => {
    expect(pickRandom(['a', 'b'], 5, identity).length).toBe(2);
  });
});
