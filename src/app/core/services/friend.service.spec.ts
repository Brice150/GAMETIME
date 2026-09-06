import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from '../interfaces/player';
import { buildPlayer } from '../../../testing/test-providers';
import { FriendService } from './friend.service';
import { GameApiService } from './game-api.service';
import { PlayerService } from './player.service';

describe('FriendService', () => {
  let service: FriendService;
  let currentPlayerSig: ReturnType<typeof signal<Player | null | undefined>>;
  let manageFriendship: Mock<() => Observable<void>>;

  /** Le joueur connecte tel que le service vient de le reposer. */
  function me(): Player {
    return currentPlayerSig() as Player;
  }

  beforeEach(() => {
    currentPlayerSig = signal<Player | null | undefined>(
      buildPlayer({ userId: 'moi', friendIds: [], friendRequestIds: [] }),
    );
    manageFriendship = vi.fn(() => of(undefined) as Observable<void>);
    TestBed.configureTestingModule({
      providers: [
        { provide: PlayerService, useValue: { currentPlayerSig } },
        { provide: GameApiService, useValue: { manageFriendship } },
      ],
    });
    service = TestBed.inject(FriendService);
  });

  it('normalise un texte pour la recherche', () => {
    expect(service.normalizeText('Élodie')).toBe(
      service.normalizeText('elodie'),
    );
  });

  describe('lecture des liens', () => {
    it('reconnait un ami', () => {
      currentPlayerSig.set(buildPlayer({ userId: 'moi', friendIds: ['u2'] }));

      expect(service.isFriend(buildPlayer({ userId: 'u2' }))).toBe(true);
      expect(service.isFriend(buildPlayer({ userId: 'u3' }))).toBe(false);
    });

    it('ne reconnait aucun ami sans joueur connecte', () => {
      currentPlayerSig.set(null);

      expect(service.isFriend(buildPlayer({ userId: 'u2' }))).toBe(false);
      expect(service.hasSentRequestTo(buildPlayer({ userId: 'u2' }))).toBe(
        false,
      );
      expect(service.hasRequestFrom(buildPlayer({ userId: 'u2' }))).toBe(false);
    });

    it('ne reconnait pas un joueur sans compte comme ami', () => {
      currentPlayerSig.set(buildPlayer({ userId: 'moi', friendIds: ['u2'] }));

      expect(
        service.isFriend({ ...buildPlayer(), userId: undefined } as Player),
      ).toBe(false);
    });

    it('voit la demande qu il a envoyee, stockee chez le destinataire', () => {
      const target = buildPlayer({ userId: 'u2', friendRequestIds: ['moi'] });

      expect(service.hasSentRequestTo(target)).toBe(true);
    });

    it('voit la demande qu il a recue', () => {
      currentPlayerSig.set(
        buildPlayer({ userId: 'moi', friendRequestIds: ['u2'] }),
      );

      expect(service.hasRequestFrom(buildPlayer({ userId: 'u2' }))).toBe(true);
    });
  });

  describe('actions', () => {
    it('transmet chaque action au serveur', async () => {
      const target = buildPlayer({ userId: 'u2' });

      await firstValueFrom(service.cancelRequest(target));

      expect(manageFriendship).toHaveBeenCalledWith('cancel', 'u2');
    });

    it('refuse d agir sur un joueur sans compte', async () => {
      const target = { ...buildPlayer(), userId: undefined } as Player;

      const failure = await new Promise<Error>((resolve) =>
        service.sendRequest(target).subscribe({ error: resolve }),
      );

      expect(failure.message).toBe('Joueur introuvable.');
      expect(manageFriendship).not.toHaveBeenCalled();
    });

    it('scelle l amitie quand la demande en croise une', async () => {
      currentPlayerSig.set(
        buildPlayer({ userId: 'moi', friendIds: [], friendRequestIds: ['u2'] }),
      );

      await firstValueFrom(service.sendRequest(buildPlayer({ userId: 'u2' })));

      expect(me().friendIds).toEqual(['u2']);
      expect(me().friendRequestIds).toEqual([]);
    });

    it('laisse une demande simple en attente', async () => {
      await firstValueFrom(service.sendRequest(buildPlayer({ userId: 'u2' })));

      expect(me().friendIds).toEqual([]);
    });

    it('ajoute l ami a l acceptation', async () => {
      currentPlayerSig.set(
        buildPlayer({ userId: 'moi', friendIds: [], friendRequestIds: ['u2'] }),
      );

      await firstValueFrom(
        service.acceptRequest(buildPlayer({ userId: 'u2' })),
      );

      expect(manageFriendship).toHaveBeenCalledWith('accept', 'u2');
      expect(me().friendIds).toEqual(['u2']);
      expect(me().friendRequestIds).toEqual([]);
    });

    it('n inscrit pas deux fois un ami deja present', async () => {
      currentPlayerSig.set(
        buildPlayer({
          userId: 'moi',
          friendIds: ['u2'],
          friendRequestIds: ['u2'],
        }),
      );

      await firstValueFrom(
        service.acceptRequest(buildPlayer({ userId: 'u2' })),
      );

      expect(me().friendIds).toEqual(['u2']);
    });

    it('retire la demande refusee sans creer d amitie', async () => {
      currentPlayerSig.set(
        buildPlayer({ userId: 'moi', friendIds: [], friendRequestIds: ['u2'] }),
      );

      await firstValueFrom(
        service.declineRequest(buildPlayer({ userId: 'u2' })),
      );

      expect(me().friendRequestIds).toEqual([]);
      expect(me().friendIds).toEqual([]);
    });

    it('retire l ami supprime', async () => {
      currentPlayerSig.set(
        buildPlayer({ userId: 'moi', friendIds: ['u2', 'u3'] }),
      );

      await firstValueFrom(service.removeFriend(buildPlayer({ userId: 'u2' })));

      expect(manageFriendship).toHaveBeenCalledWith('remove', 'u2');
      expect(me().friendIds).toEqual(['u3']);
    });

    it('ne touche a rien en local si le serveur refuse', async () => {
      manageFriendship.mockReturnValue(throwError(() => new Error('refuse')));
      currentPlayerSig.set(buildPlayer({ userId: 'moi', friendIds: ['u2'] }));

      await new Promise((resolve) =>
        service.removeFriend(buildPlayer({ userId: 'u2' })).subscribe({
          error: resolve,
        }),
      );

      expect(me().friendIds).toEqual(['u2']);
    });

    it('ne modifie rien quand plus personne n est connecte', async () => {
      const promises = [
        service.acceptRequest(buildPlayer({ userId: 'u2' })),
        service.declineRequest(buildPlayer({ userId: 'u2' })),
        service.removeFriend(buildPlayer({ userId: 'u2' })),
      ];
      currentPlayerSig.set(null);

      for (const action of promises) {
        await firstValueFrom(action);
      }

      expect(currentPlayerSig()).toBeNull();
    });
  });
});
