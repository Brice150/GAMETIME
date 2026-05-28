import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerService } from '../services/player.service';
import { firstValueFrom } from 'rxjs';

export const adminGuard: CanActivateFn = async () => {
  const playerService = inject(PlayerService);
  const router = inject(Router);

  try {
    const player = await firstValueFrom(playerService.playerReady$);

    if (player?.isAdmin) {
      return true;
    } else {
      router.navigate(['/accueil']);
      return false;
    }
  } catch {
    router.navigate(['/']);
    return false;
  }
};
