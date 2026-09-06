import { Type } from '@angular/core';
import { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { adminGuard } from './core/guards/admin.guard';
import { noUserGuard } from './core/guards/no-user.guard';
import { userGuard } from './core/guards/user.guard';

const routeFor = (path: string): Route =>
  routes.find((route) => route.path === path)!;

describe('routes', () => {
  it('reserve l accueil de connexion aux visiteurs', () => {
    expect(routeFor('').canActivate).toEqual([noUserGuard]);
  });

  it('demande un compte pour les pages de jeu', () => {
    for (const path of ['accueil', 'parametres', 'classement', 'room/:id']) {
      expect(routeFor(path).canActivate, path).toEqual([userGuard]);
    }
  });

  it('reserve l administration aux administrateurs', () => {
    expect(routeFor('admin').canActivate).toEqual([adminGuard]);
  });

  it('renvoie a l accueil toute adresse inconnue', () => {
    expect(routeFor('**')).toMatchObject({
      redirectTo: 'accueil',
      pathMatch: 'full',
    });
  });

  it('charge le composant de chaque page', async () => {
    const loaders = routes
      .map((route) => route.loadComponent)
      .filter((load): load is () => Promise<Type<unknown>> => !!load);

    expect(loaders.length).toBe(6);

    for (const load of loaders) {
      expect(await load()).toBeTruthy();
    }
  });
});
