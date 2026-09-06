import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { noUserGuard } from './no-user.guard';

describe('noUserGuard', () => {
  let navigate: Mock;

  function setup(user: unknown) {
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: UserService, useValue: { currentUserSig: signal(user) } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      noUserGuard({} as never, {} as never),
    ) as Observable<boolean>;

    return firstValueFrom(result);
  }

  it('laisse passer un visiteur non connecte', async () => {
    expect(await setup(null)).toEqual(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renvoie un utilisateur connecte vers accueil', async () => {
    expect(await setup({ uid: 'u1' })).toEqual(false);
    expect(navigate).toHaveBeenCalledWith(['/accueil']);
  });
});
