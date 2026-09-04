import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { appConfig } from './app.config';

// Le rendu serveur ne sert qu'a pregenerer la page d'accueil au build : il n'y
// a pas de serveur Node en production, seulement le HTML produit.
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
