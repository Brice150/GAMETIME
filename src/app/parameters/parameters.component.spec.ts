import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  overrideProvider as override,
} from '../../testing/test-providers';
import { PlayerService } from '../core/services/player.service';
import { UserService } from '../core/services/user.service';
import { ParametersComponent } from './parameters.component';

/** Un compte invite : c'est lui qui debloque la liaison de compte. */
const guest = (patch: Record<string, unknown> = {}): Provider =>
  override(UserService, {
    auth: { currentUser: { isAnonymous: true } },
    ...patch,
  });

const credential = { user: { email: 'joueur@example.com' } };

describe('ParametersComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<ParametersComponent> {
    await TestBed.configureTestingModule({
      imports: [ParametersComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(ParametersComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /** Fenetre modale rendue sans l'ouvrir : seule sa reponse compte. */
  function stubDialog(component: ParametersComponent, answer: unknown) {
    return vi
      .spyOn(component.dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(answer) } as never);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('compte temporaire', () => {
    it('reconnait un compte permanent', async () => {
      const component = await build();

      expect(component.isTemporaryAccount()).toBe(false);
    });

    it('prepare la fenetre de liaison pour un invite', async () => {
      const warmUp = vi.fn();
      const component = await build([guest({ warmUpSignInPopup: warmUp })]);

      expect(component.isTemporaryAccount()).toBe(true);
      expect(warmUp).toHaveBeenCalled();
    });

    it('lie le compte a Google', async () => {
      const component = await build([
        guest({ linkAnonymousAccountWithGoogle: () => of(credential) }),
      ]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.linkTemporaryWithGoogle();

      expect(component.userService.currentUserSig()).toEqual({
        email: 'joueur@example.com',
        isAnonymous: false,
      });
      expect(info).toHaveBeenCalledWith('Compte lié avec Google', 'Compte');
      expect(component.loading()).toBe(false);
    });

    it('lie le compte a GitHub', async () => {
      const component = await build([
        guest({ linkAnonymousAccountWithGithub: () => of(credential) }),
      ]);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.linkTemporaryWithGithub();

      expect(info).toHaveBeenCalledWith('Compte lié avec GitHub', 'Compte');
    });

    it('nomme « Compte invité » un fournisseur sans adresse', async () => {
      const component = await build([
        guest({
          linkAnonymousAccountWithGithub: () => of({ user: { email: null } }),
        }),
      ]);

      component.linkTemporaryWithGithub();

      expect(component.userService.currentUserSig()).toEqual({
        email: 'Compte invité',
        isAnonymous: false,
      });
    });

    it('signale un echec de liaison', async () => {
      const component = await build([
        guest({
          linkAnonymousAccountWithGoogle: () =>
            throwError(() => new Error('refus')),
          linkAnonymousAccountWithGithub: () =>
            throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.linkTemporaryWithGoogle();
      component.linkTemporaryWithGithub();

      expect(handleError).toHaveBeenCalledTimes(2);
      expect(component.loading()).toBe(false);
    });
  });

  describe('demandes d amis en attente', () => {
    it('compte les demandes recues', async () => {
      const component = await build();

      component.playerService.currentPlayerSig.set(
        buildPlayer({ friendRequestIds: ['u2', 'u3'] }),
      );

      expect(component.pendingRequestsNumber).toBe(2);
    });

    it('n en compte aucune sans fiche joueur', async () => {
      const component = await build();
      component.playerService.currentPlayerSig.set(null);

      expect(component.pendingRequestsNumber).toBe(0);
    });
  });

  describe('modification du profil', () => {
    it('enregistre un pseudo disponible', async () => {
      const component = await build();
      stubDialog(component, { ...buildPlayer(), username: 'Nouveau' });
      const update = vi.spyOn(component.playerService, 'updatePlayer');
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.openUserDialog();

      expect(update).toHaveBeenCalled();
      expect(component.playerService.currentPlayerSig()?.username).toBe(
        'Nouveau',
      );
      expect(info).toHaveBeenCalledWith('Profil modifié', 'Profil');
      expect(component.loading()).toBe(false);
    });

    it('propose une variante quand le pseudo est deja pris', async () => {
      const component = await build([
        override(PlayerService, {
          getAllPlayers: () =>
            of([
              buildPlayer({ id: 'p2', userId: 'u2', username: 'Pris' }),
              buildPlayer({ id: 'p1', userId: 'u1', username: 'Test' }),
            ]),
        }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');
      const open = vi
        .spyOn(component.dialog, 'open')
        .mockReturnValueOnce({
          afterClosed: () => of({ ...buildPlayer(), username: 'Pris' }),
        } as never)
        .mockReturnValue({ afterClosed: () => of(null) } as never);

      component.openUserDialog();

      expect(error).toHaveBeenCalledWith(
        'Ce nom est déjà pris. Essayez « Pris2 »',
      );
      // La fenetre est rouverte, preremplie avec la variante proposee.
      expect(open.mock.calls[1][1]?.data).toMatchObject({
        username: 'Pris2',
      });
    });

    it('ne modifie rien quand la fenetre est fermee', async () => {
      const component = await build();
      stubDialog(component, null);
      const update = vi.spyOn(component.playerService, 'updatePlayer');

      component.openUserDialog();

      expect(update).not.toHaveBeenCalled();
    });

    it('signale un refus d enregistrement', async () => {
      const component = await build();
      stubDialog(component, buildPlayer());
      vi.spyOn(component.playerService, 'updatePlayer').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.openUserDialog();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  describe('suppression du profil', () => {
    it('efface rooms, fiche joueur, profil puis deconnecte', async () => {
      const component = await build();
      stubDialog(component, true);
      const deleteRooms = vi.spyOn(component.roomService, 'deleteUserRooms');
      const deletePlayer = vi.spyOn(
        component.playerService,
        'deleteUserPlayer',
      );
      const logout = vi.spyOn(component.userService, 'logout');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.openDialog();

      expect(deleteRooms).toHaveBeenCalled();
      expect(deletePlayer).toHaveBeenCalled();
      expect(logout).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/']);
      expect(info).toHaveBeenCalledWith('Profil supprimé', 'Profil');
    });

    it('va au bout meme si le compte ou la deconnexion resiste', async () => {
      const component = await build();
      stubDialog(component, true);
      vi.spyOn(component.profileService, 'deleteProfile').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      vi.spyOn(component.userService, 'logout').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.openDialog();

      expect(info).toHaveBeenCalledWith('Profil supprimé', 'Profil');
    });

    it('ne supprime rien sans confirmation', async () => {
      const component = await build();
      stubDialog(component, false);
      const deleteRooms = vi.spyOn(component.roomService, 'deleteUserRooms');

      component.openDialog();

      expect(deleteRooms).not.toHaveBeenCalled();
    });

    it('signale un refus de suppression', async () => {
      const component = await build();
      stubDialog(component, true);
      vi.spyOn(component.roomService, 'deleteUserRooms').mockReturnValue(
        throwError(() => new Error('refus')),
      );
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.openDialog();

      expect(handleError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });
  });

  it('bascule entre le compte et les amis', async () => {
    await TestBed.configureTestingModule({
      imports: [ParametersComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(ParametersComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-user'),
    ).toBeTruthy();

    fixture.componentInstance.tab.set('amis');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-friends'),
    ).toBeTruthy();
  });
});
