// Fin de manche : le verdict local sert a l'affichage immediat, le mot saisi
// part au serveur qui, lui, tranche.
export interface RoundAnswer {
  won: boolean;
  answer: string;
}
