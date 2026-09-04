import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { noUserGuard } from './no-user.guard';

describe('noUserGuard', () => {
  let navigate: jasmine.Spy;

  function setup(user: unknown) {
    navigate = jasmine.createSpy('navigate');

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
    await expectAsync(setup(null)).toBeResolvedTo(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renvoie un utilisateur connecte vers accueil', async () => {
    await expectAsync(setup({ uid: 'u1' })).toBeResolvedTo(false);
    expect(navigate).toHaveBeenCalledWith(['/accueil']);
  });
});
