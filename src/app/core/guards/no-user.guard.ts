import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { UserService } from '../services/user.service';

export const noUserGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return toObservable(userService.currentUserSig).pipe(
    filter((user) => user !== undefined),
    take(1),
    map((user) => {
      if (user === null) {
        return true;
      }

      router.navigate(['/accueil']);
      return false;
    }),
  );
};
