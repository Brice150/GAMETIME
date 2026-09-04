import { ordinalSuffix } from '../../core/utils/ordinal.util';
import { OrdinalPipe } from './ordinal.pipe';

describe('OrdinalPipe', () => {
  const pipe = new OrdinalPipe();

  it('utilise er pour la premiere place et eme pour les suivantes', () => {
    expect(pipe.transform(1)).toBe('er');
    expect(pipe.transform(2)).toBe('ème');
    expect(pipe.transform(12)).toBe('ème');
  });
});

describe('ordinalSuffix', () => {
  it('renvoie le meme suffixe que le pipe', () => {
    expect(ordinalSuffix(1)).toBe('er');
    expect(ordinalSuffix(3)).toBe('ème');
  });
});
