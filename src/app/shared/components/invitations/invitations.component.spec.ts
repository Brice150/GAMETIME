import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { Router, provideRouter } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  overrideProvider as override,
} from '../../../../testing/test-providers';
import { Invitation } from '../../../core/interfaces/invitation';
import { InvitationService } from '../../../core/services/invitation.service';
import { InvitationsComponent } from './invitations.component';

function buildInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'i1',
    roomId: 'r1',
    roomCode: 'ABCD',
    fromUserId: 'u2',
    fromUsername: 'Zoé',
    fromAnimal: '🐱',
    toUserId: 'u1',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('InvitationsComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<InvitationsComponent> {
    await TestBed.configureTestingModule({
      imports: [InvitationsComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(InvitationsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /**
   * L'ecoute Firestore est rendue par un sujet : le test choisit quand les
   * invitations arrivent, donc ce que le composant sait deja a ce moment-la.
   */
  async function buildWithStream(): Promise<{
    component: InvitationsComponent;
    stream: Subject<Invitation[]>;
  }> {
    const stream = new Subject<Invitation[]>();
    const component = await build([
      override(InvitationService, { getMyInvitations: () => stream }),
    ]);

    return { component, stream };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  describe('reception', () => {
    it('previent le joueur et pose une notification, une seule fois', async () => {
      const { component, stream } = await buildWithStream();
      const info = vi.spyOn(component.toastrHelper, 'info');
      const notify = vi.spyOn(component.notificationService, 'notify');

      stream.next([buildInvitation()]);
      stream.next([buildInvitation()]);

      expect(component.invitations().length).toBe(1);
      expect(info).toHaveBeenCalledExactlyOnceWith(
        'Zoé vous invite dans une room',
        'Invitation',
      );
      expect(notify).toHaveBeenCalledExactlyOnceWith(
        'Game Time',
        'Zoé vous invite dans la room ABCD',
        'i1',
      );
    });

    it('ecarte une invitation trop ancienne', async () => {
      const { component, stream } = await buildWithStream();

      stream.next([
        buildInvitation({
          createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
        }),
      ]);

      expect(component.invitations()).toEqual([]);
    });

    it('garde une invitation sans horodatage', async () => {
      const { component, stream } = await buildWithStream();

      stream.next([buildInvitation({ createdAt: null as never })]);

      expect(component.invitations().length).toBe(1);
    });

    it('lit un horodatage au format Firestore', async () => {
      const { component, stream } = await buildWithStream();

      stream.next([
        buildInvitation({
          createdAt: Timestamp.fromDate(new Date()) as unknown as Date,
        }),
      ]);

      expect(component.invitations().length).toBe(1);
    });

    it('garde une invitation dont la date est illisible', async () => {
      const { component, stream } = await buildWithStream();

      stream.next([buildInvitation({ createdAt: 'hier' as never })]);

      expect(component.invitations().length).toBe(1);
    });

    it('classe la plus recente en premier', async () => {
      const { component, stream } = await buildWithStream();

      stream.next([
        buildInvitation({
          id: 'vieille',
          createdAt: new Date(Date.now() - 60_000),
        }),
        buildInvitation({ id: 'recente', createdAt: new Date() }),
      ]);

      expect(component.invitations().map((item) => item.id)).toEqual([
        'recente',
        'vieille',
      ]);
    });

    it('tait l invitation vers la room deja ouverte', async () => {
      // L'URL est lue a l'ouverture du composant : elle est posee avant.
      vi.spyOn(Router.prototype, 'url', 'get').mockReturnValue('/room/r1');
      const { component, stream } = await buildWithStream();

      stream.next([
        buildInvitation({ roomId: 'r1' }),
        buildInvitation({ id: 'i2', roomId: 'r2' }),
      ]);

      expect(component.invitations().map((item) => item.roomId)).toEqual([
        'r2',
      ]);
    });

    it('relit l URL a chaque navigation', async () => {
      const stream = new Subject<Invitation[]>();
      const component = await build([
        provideRouter([{ path: 'room/:id', children: [] }]),
        override(InvitationService, { getMyInvitations: () => stream }),
      ]);

      await TestBed.inject(Router).navigateByUrl('/room/r1');
      stream.next([buildInvitation({ roomId: 'r1' })]);

      expect(component.invitations()).toEqual([]);
    });

    it('n annonce pas une invitation sans identifiant', async () => {
      const { component, stream } = await buildWithStream();
      const info = vi.spyOn(component.toastrHelper, 'info');

      stream.next([buildInvitation({ id: undefined })]);

      expect(component.invitations().length).toBe(1);
      expect(info).not.toHaveBeenCalled();
    });

    it('signale un echec d ecoute', async () => {
      const component = await build([
        override(InvitationService, {
          getMyInvitations: () => throwError(() => new Error('refus')),
        }),
      ]);

      expect(component.invitations()).toEqual([]);
    });
  });

  describe('actions', () => {
    it('rejoint la room invitee et retire l invitation', async () => {
      const { component, stream } = await buildWithStream();
      stream.next([buildInvitation()]);
      const newGame = vi.spyOn(component.localStorageService, 'newGame');
      const navigate = vi
        .spyOn(component.router, 'navigate')
        .mockResolvedValue(true);
      const remove = vi.spyOn(component.invitationService, 'deleteInvitation');

      component.join(buildInvitation());

      expect(remove).toHaveBeenCalledWith('i1');
      expect(component.invitations()).toEqual([]);
      expect(newGame).toHaveBeenCalledWith('r1');
      expect(navigate).toHaveBeenCalledWith(['/room/r1']);
    });

    it('ignore une invitation sans identifiant', async () => {
      const { component, stream } = await buildWithStream();
      stream.next([buildInvitation()]);
      const remove = vi.spyOn(component.invitationService, 'deleteInvitation');

      component.dismiss(buildInvitation({ id: undefined }));

      expect(remove).not.toHaveBeenCalled();
      expect(component.invitations().length).toBe(1);
    });

    it('signale un echec de suppression', async () => {
      const stream = new Subject<Invitation[]>();
      const component = await build([
        override(InvitationService, {
          getMyInvitations: () => stream,
          deleteInvitation: () => throwError(() => new Error('refus')),
        }),
      ]);
      stream.next([buildInvitation()]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.dismiss(buildInvitation());

      expect(handleError).toHaveBeenCalled();
    });
  });
});
