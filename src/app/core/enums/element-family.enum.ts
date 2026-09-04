// Familles condensees : la classification complete donnerait neuf valeurs,
// bien trop pour un curseur, et la plupart ne separent que des metaux.
export enum ElementFamily {
  Tout = 1,
  Metaux,
  NonMetaux,
  Halogenes,
  GazNobles,
  Terres,
}
