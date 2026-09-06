import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
  buildRoom,
  overrideProvider as override,
} from '../../../../testing/test-providers';
import { InvitationService } from '../../../core/services/invitation.service';
import { PlayerService } from '../../../core/services/player.service';
import { Room } from '../../../core/interfaces/room';
import { MultiplayerDialogComponent } from './multiplayer-dialog.component';

const zoe = buildPlayer({ id: 'p2', userId: 'u2', username: 'Zoé' });
const alice = buildPlayer({ id: 'p3', userId: 'u3', username: 'Alice' });

/** Le joueur courant et ses amis, tels que la fenetre les lit. */
const withFriends = (friendIds: string[], friends = [zoe, alice]): Provider =>
  override(PlayerService, {
    currentPlayerSig: signal(buildPlayer({ friendIds })),
    getPlayers: () => of(friends),
  });

describe('MultiplayerDialogComponent', () => {
  const close = vi.fn();

  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
    room: Room | null = buildRoom(),
  ): Promise<MultiplayerDialogComponent> {
    await TestBed.configureTestingModule({
      imports: [MultiplayerDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: room },
        ...extra,
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(MultiplayerDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    // jsdom ne fournit ni presse-papiers ni feuille de partage.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    delete (navigator as { share?: unknown }).share;
    close.mockClear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('affiche le code et le lien de la partie', async () => {
    const component = await build();

    expect(component.roomCode()).toBe('ABCD');
    expect(component.link()).toBe(window.location.href);
  });

  it('accepte une fenetre ouverte sans room', async () => {
    const component = await build([], null);

    expect(component.roomCode()).toBe('');
  });

  describe('liste d amis', () => {
    it('n interroge personne quand le joueur n a pas d amis', async () => {
      const component = await build();

      expect(component.loadingFriends()).toBe(false);
      expect(component.friends()).toEqual([]);
    });

    it('classe les amis par pseudo', async () => {
      const component = await build([withFriends(['u2', 'u3'])]);

      expect(component.friends().map((friend) => friend.id)).toEqual([
        'p3',
        'p2',
      ]);
      expect(component.loadingFriends()).toBe(false);
    });

    it('signale un echec de chargement', async () => {
      const component = await build([
        override(PlayerService, {
          currentPlayerSig: signal(buildPlayer({ friendIds: ['u2'] })),
          getPlayers: () => throwError(() => new Error('refus')),
        }),
      ]);

      expect(component.loadingFriends()).toBe(false);
      expect(component.friends()).toEqual([]);
    });

    it('reconnait un ami deja dans la room', async () => {
      const component = await build(
        [withFriends(['u2', 'u3'])],
        buildRoom({ playerIds: ['u1', 'u2'] }),
      );

      expect(component.isInRoom(zoe)).toBe(true);
      expect(component.isInRoom(alice)).toBe(false);
      expect(component.isInRoom({ ...zoe, userId: undefined })).toBe(false);
    });
  });

  describe('invitation', () => {
    it('invite un ami et le marque comme invite', async () => {
      const component = await build([withFriends(['u2'])]);
      const send = vi.spyOn(component.invitationService, 'sendInvitation');
      const info = vi.spyOn(component.toastrHelper, 'info');

      expect(component.isInvited(zoe)).toBe(false);

      component.invite(zoe);

      expect(send).toHaveBeenCalledWith(
        component.room,
        expect.anything(),
        'u2',
      );
      expect(component.isInvited(zoe)).toBe(true);
      expect(info).toHaveBeenCalledWith('Zoé a été invité', 'Room');
    });

    it('n invite ni sans fiche joueur ni sans compte destinataire', async () => {
      const component = await build([
        override(PlayerService, { currentPlayerSig: signal(null) }),
      ]);
      const send = vi.spyOn(component.invitationService, 'sendInvitation');

      component.invite(zoe);
      component.playerService.currentPlayerSig.set(buildPlayer());
      component.invite({ ...zoe, userId: undefined });

      expect(send).not.toHaveBeenCalled();
      expect(component.isInvited({ ...zoe, userId: undefined })).toBe(false);
    });

    it('signale un echec d invitation', async () => {
      const component = await build([
        withFriends(['u2']),
        override(InvitationService, {
          sendInvitation: () => throwError(() => new Error('refus')),
        }),
      ]);
      const handleError = vi.spyOn(component.toastrHelper, 'handleError');

      component.invite(zoe);

      expect(handleError).toHaveBeenCalled();
      expect(component.isInvited(zoe)).toBe(false);
    });
  });

  describe('partage', () => {
    it('copie le code et le lien', async () => {
      const component = await build();
      const info = vi.spyOn(component.toastrHelper, 'info');

      component.copyCode();
      component.copyLink();
      await Promise.resolve();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        window.location.href,
      );
      expect(info.mock.calls.map((call) => call[1])).toEqual(['Code', 'Lien']);
    });

    it('passe par la feuille de partage du systeme', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: share,
        configurable: true,
      });
      const component = await build();

      component.share();

      expect(component.canShare).toBe(true);
      expect(share).toHaveBeenCalledWith({
        title: 'Game Time',
        text: 'Rejoignez ma partie avec le code ABCD',
        url: window.location.href,
      });
    });

    it('encaisse un partage annule', async () => {
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(new Error('annule')),
        configurable: true,
      });
      const component = await build();

      expect(() => component.share()).not.toThrow();
    });
  });

  it('ferme la fenetre sans rien renvoyer', async () => {
    const component = await build();

    component.cancel();

    expect(close).toHaveBeenCalledWith(undefined);
  });
});
