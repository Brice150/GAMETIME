import { ContinentPipe } from './continent.pipe';

describe('ContinentPipe', () => {
  const pipe = new ContinentPipe();

  it('traduit les continents connus', () => {
    expect(pipe.transform(1)).toBe('Monde');
    expect(pipe.transform(2)).toBe('Europe');
    expect(pipe.transform(6)).toBe('Oceanie');
  });

  it('retombe sur Monde pour un continent inconnu', () => {
    expect(pipe.transform(0)).toBe('Monde');
    expect(pipe.transform(99)).toBe('Monde');
  });
});
