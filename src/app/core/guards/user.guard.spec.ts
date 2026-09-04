import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { userGuard } from './user.guard';

describe('userGuard', () => {
  let navigate: jasmine.Spy;
  let userService: { currentUserSig: unknown; redirectUrl: string | null };

  function setup(user: unknown, url = '/classement') {
    navigate = jasmine.createSpy('navigate');
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
    await expectAsync(setup({ uid: 'u1' })).toBeResolvedTo(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renvoie a la connexion et memorise la page demandee', async () => {
    await expectAsync(setup(null)).toBeResolvedTo(false);

    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(userService.redirectUrl).toBe('/classement');
  });

  it('ne memorise pas la racine comme page de retour', async () => {
    await expectAsync(setup(null, '/')).toBeResolvedTo(false);

    expect(userService.redirectUrl).toBeNull();
  });
});
