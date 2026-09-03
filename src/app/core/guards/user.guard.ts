import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { UserService } from '../services/user.service';

export const userGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  return toObservable(userService.currentUserSig).pipe(
    filter((user) => user !== undefined),
    take(1),
    map((user) => {
      if (user) {
        return true;
      }

      // Le lien demande est memorise : la page de connexion y renvoie
      // une fois le compte pret.
      userService.redirectUrl = state.url === '/' ? null : state.url;
      router.navigate(['/']);
      return false;
    }),
  );
};
