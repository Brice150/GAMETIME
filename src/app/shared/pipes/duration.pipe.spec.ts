import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('affiche un tiret pour une valeur absente ou negative', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(-1)).toBe('—');
    expect(pipe.transform('12000')).toBe('—');
  });

  it('affiche les secondes au dixieme sous la minute', () => {
    expect(pipe.transform(0)).toBe('0.0s');
    expect(pipe.transform(12_340)).toBe('12.3s');
    expect(pipe.transform(59_900)).toBe('59.9s');
  });

  it('passe aux minutes puis aux heures', () => {
    expect(pipe.transform(60_000)).toBe('1m 0s');
    expect(pipe.transform(3_599_000)).toBe('59m 59s');
    expect(pipe.transform(3_600_000)).toBe('1h 0m');
  });

  it('passe aux jours au-dela de 24 heures', () => {
    expect(pipe.transform(90_000_000)).toBe('1j 1h');
  });
});
