export interface LegalDocument {
  key: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: string;
}

// L'ordre est celui du pied de page et de la navigation entre documents.
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    key: 'mentions-legales',
    title: 'Mentions légales',
    shortTitle: 'Mentions légales',
    subtitle: 'Éditeur, hébergeur et responsabilités.',
    icon: 'bxs-institution',
  },
  {
    key: 'cgu',
    title: 'Conditions générales d’utilisation',
    shortTitle: 'CGU',
    subtitle: 'Les règles d’accès et d’usage du jeu.',
    icon: 'bxs-file',
  },
  {
    key: 'confidentialite',
    title: 'Politique de confidentialité',
    shortTitle: 'Confidentialité',
    subtitle: 'Vos données, leur traitement et vos droits.',
    icon: 'bx-shield-quarter',
  },
  {
    key: 'cookies',
    title: 'Cookies et traceurs',
    shortTitle: 'Cookies',
    subtitle: 'Ce qui est stocké sur votre appareil, et pourquoi.',
    icon: 'bxs-cookie',
  },
];

// A changer a chaque modification d'un document, et a signaler aux joueurs
// si elle est importante.
export const LEGAL_LAST_UPDATE = '28/09/2026';
