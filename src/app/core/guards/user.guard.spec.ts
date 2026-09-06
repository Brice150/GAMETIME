import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { userGuard } from './user.guard';

describe('userGuard', () => {
  let navigate: Mock;
  let userService: { currentUserSig: unknown; redirectUrl: string | null };

  function setup(user: unknown, url = '/classement') {
    navigate = vi.fn();
    userService = { currentUserSig: signal(user), redirectUrl: null };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      userGuard({} as never, { url } as RouterStateSnapshot),
    ) as Observable<boolean>;

    return firstValueFrom(result);
  }

  it('laisse passer un utilisateur connecte', async () => {
    expect(await setup({ uid: 'u1' })).toEqual(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renvoie a la connexion et memorise la page demandee', async () => {
    expect(await setup(null)).toEqual(false);

    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(userService.redirectUrl).toBe('/classement');
  });

  it('ne memorise pas la racine comme page de retour', async () => {
    expect(await setup(null, '/')).toEqual(false);

    expect(userService.redirectUrl).toBeNull();
  });
});
