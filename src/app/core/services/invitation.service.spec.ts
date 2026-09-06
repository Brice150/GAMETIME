import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from '../interfaces/player';
import { Room } from '../interfaces/room';
import { buildPlayer, buildRoom } from '../../../testing/test-providers';
import { InvitationService } from './invitation.service';
import { UserService } from './user.service';

// Le service parle a Firestore par les fonctions du SDK, pas par une dependance : on les remplace
// au niveau du module pour observer les chemins et les documents ecrits.
const setDoc = vi.fn((path: string, data: Record<string, unknown>) =>
  Promise.resolve({ path, data }),
);
const deleteDoc = vi.fn((path: string) => Promise.resolve(path));
let collectionData = vi.fn(() => of([] as unknown[]));
let lastQuery: { field: string; value: unknown } | null = null;

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: (_firestore: unknown, path: string) => ({ path }),
  doc: (_firestore: unknown, path: string) => path,
  query: (source: unknown, clause: { field: string; value: unknown }) => {
    lastQuery = clause;
    return source;
  },
  where: (field: string, _op: string, value: unknown) => ({ field, value }),
  setDoc: (path: string, data: Record<string, unknown>) => setDoc(path, data),
  deleteDoc: (path: string) => deleteDoc(path),
  collectionData: (...args: unknown[]) =>
    (collectionData as unknown as (...a: unknown[]) => unknown)(...args),
}));

describe('InvitationService', () => {
  let service: InvitationService;
  let currentUser: { uid: string } | null;

  function build(): InvitationService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
        {
          provide: UserService,
          useValue: {
            auth: {
              get currentUser() {
                return currentUser;
              },
            },
          },
        },
      ],
    });
    return TestBed.inject(InvitationService);
  }

  beforeEach(() => {
    setDoc.mockClear();
    deleteDoc.mockClear();
    lastQuery = null;
    collectionData = vi.fn(() => of([] as unknown[]));
    currentUser = { uid: 'u1' };
    service = build();
  });

  it('ne demande que les invitations adressees au joueur connecte', async () => {
    collectionData = vi.fn(() => of([{ id: 'r1_u1' }]));

    const invitations = await firstValueFrom(service.getMyInvitations());

    expect(lastQuery).toEqual({ field: 'toUserId', value: 'u1' });
    expect(invitations).toEqual([{ id: 'r1_u1' }]);
  });

  it('ne demande rien quand personne n est connecte', async () => {
    currentUser = null;

    const invitations = await firstValueFrom(service.getMyInvitations());

    expect(invitations).toEqual([]);
    expect(collectionData).not.toHaveBeenCalled();
  });

  it('range une invitation sous un identifiant unique par salle et destinataire', async () => {
    const room = buildRoom({ id: 'r1', roomCode: 'ABCD' });
    const sender = buildPlayer({
      userId: 'u1',
      username: 'Alice',
      animal: '🐱',
    });

    await firstValueFrom(service.sendInvitation(room, sender, 'u2'));

    expect(setDoc.mock.lastCall![0]).toBe('invitations/r1_u2');
    expect(setDoc.mock.lastCall![1]).toMatchObject({
      roomId: 'r1',
      roomCode: 'ABCD',
      fromUserId: 'u1',
      fromUsername: 'Alice',
      fromAnimal: '🐱',
      toUserId: 'u2',
    });
  });

  it('refuse d inviter dans une salle sans identifiant', async () => {
    const room = { ...buildRoom(), id: undefined } as unknown as Room;

    const failure = await new Promise((resolve) =>
      service.sendInvitation(room, buildPlayer(), 'u2').subscribe({
        error: resolve,
      }),
    );

    expect(failure).toBe('Room introuvable.');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('refuse d inviter de la part d un joueur sans compte', async () => {
    const sender = { ...buildPlayer(), userId: undefined } as unknown as Player;

    const failure = await new Promise((resolve) =>
      service.sendInvitation(buildRoom(), sender, 'u2').subscribe({
        error: resolve,
      }),
    );

    expect(failure).toBe('Room introuvable.');
  });

  it('supprime une invitation par son identifiant', async () => {
    await firstValueFrom(service.deleteInvitation('r1_u2'));

    expect(deleteDoc).toHaveBeenCalledWith('invitations/r1_u2');
  });
});
