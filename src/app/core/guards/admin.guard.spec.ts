import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { PlayerService } from '../services/player.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let navigate: jasmine.Spy;

  function setup(playerReady$: Observable<unknown>) {
    navigate = jasmine.createSpy('navigate');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PlayerService, useValue: { playerReady$ } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    return TestBed.runInInjectionContext(
      () => adminGuard({} as never, {} as never) as Promise<boolean>,
    );
  }

  it('laisse passer un administrateur', async () => {
    const allowed = await setup(of({ isAdmin: true }));

    expect(allowed).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renvoie un joueur non administrateur vers accueil', async () => {
    const allowed = await setup(of({ isAdmin: false }));

    expect(allowed).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/accueil']);
  });

  it('renvoie a la racine si la fiche joueur est en erreur', async () => {
    const allowed = await setup(throwError(() => new Error('boom')));

    expect(allowed).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
