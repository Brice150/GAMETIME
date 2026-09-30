import type { MotionStep } from '../app/welcome/motions/motion-player';

// Etape sans attente : une scene jouee avec elle arrive directement a son
// etat final, comme pour un utilisateur qui reduit les animations.
export const instantStep: MotionStep = {
  instant: true,
  wait: () => Promise.resolve(),
  check: () => undefined,
};
