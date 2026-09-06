import { describe, expect, it } from 'vitest';
import { normalizeUsername, suggestAvailableUsername } from './username.util';

describe('normalizeUsername', () => {
  it('ignore la casse, les accents et les espaces autour', () => {
    expect(normalizeUsername('  Élodie ')).toBe('elodie');
    expect(normalizeUsername('ELODIE')).toBe(normalizeUsername('élodie'));
  });
});

describe('suggestAvailableUsername', () => {
  it('rend le pseudo demande quand il est libre', () => {
    expect(suggestAvailableUsername('Alex', new Set(['bob']))).toBe('Alex');
  });

  it('numerote la fin quand le pseudo est pris', () => {
    expect(suggestAvailableUsername('Alex', new Set(['alex']))).toBe('Alex2');
  });

  it('incremente le numero plutot que de l empiler', () => {
    expect(suggestAvailableUsername('Alex2', new Set(['alex', 'alex2']))).toBe(
      'Alex3',
    );
  });

  it('saute les numeros deja pris', () => {
    expect(
      suggestAvailableUsername('Alex', new Set(['alex', 'alex2', 'alex3'])),
    ).toBe('Alex4');
  });

  it('compare sans tenir compte de la casse ni des accents', () => {
    expect(suggestAvailableUsername('Élodie', new Set(['elodie']))).toBe(
      'Élodie2',
    );
  });

  it('garde une base quand le pseudo demande n est fait que de chiffres', () => {
    expect(suggestAvailableUsername('42', new Set(['42']))).toBe('422');
  });

  it('finit par numeroter a l horloge quand tout est pris', () => {
    const taken = new Set(['alex']);
    for (let suffix = 2; suffix <= 999; suffix++) {
      taken.add(`alex${suffix}`);
    }

    expect(suggestAvailableUsername('Alex', taken)).toMatch(/^Alex\d{4}$/);
  });
});
