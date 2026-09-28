import { Enterprise } from '../../app/core/interfaces/enterprise';

// Meme editeur que Life Rise : les deux sites doivent afficher les memes
// informations legales.
export const entreprise: Enterprise = {
  name: 'Lecomte Digital Solutions',
  email: 'lecomte.digitalsolutions@gmail.com',
  adress: 'ADRESSE',
  siret: 'SIRET',
  rcs: 'RCS',
  legalStatus: 'Micro-entreprise',
  contactName: 'Brice Lecomte',
  hostName: 'Google Ireland Limited (Firebase Hosting)',
  hostAdress: 'Gordon House, Barrow Street, Dublin 4, Irlande',
};

export function getEntreprise(): Enterprise {
  return entreprise;
}
