import { BrandCategoryPipe } from './brand-category.pipe';

describe('BrandCategoryPipe', () => {
  const pipe = new BrandCategoryPipe();

  it('traduit les categories connues', () => {
    expect(pipe.transform(1)).toBe('Tout');
    expect(pipe.transform(2)).toBe('Voitures');
    expect(pipe.transform(5)).toBe('Aliments');
  });

  it('retombe sur Tout pour une categorie inconnue', () => {
    expect(pipe.transform(0)).toBe('Tout');
    expect(pipe.transform(99)).toBe('Tout');
  });
});
