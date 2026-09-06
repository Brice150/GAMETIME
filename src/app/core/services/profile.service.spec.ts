import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileService } from './profile.service';
import { UserService } from './user.service';

const deleteUser = vi.fn((user: { uid: string }) => Promise.resolve(user));
vi.mock('@angular/fire/auth', () => ({
  deleteUser: (user: { uid: string }) => deleteUser(user),
}));

describe('ProfileService', () => {
  let service: ProfileService;
  let currentUser: { uid: string } | null;

  beforeEach(() => {
    deleteUser.mockClear();
    currentUser = { uid: 'u1' };
    TestBed.configureTestingModule({
      providers: [
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
    service = TestBed.inject(ProfileService);
  });

  it('supprime le compte du joueur connecte', async () => {
    await new Promise<void>((resolve) =>
      service
        .deleteProfile()
        .subscribe({ next: () => resolve(), complete: () => resolve() }),
    );

    expect(deleteUser).toHaveBeenCalledWith({ uid: 'u1' });
  });

  it('echoue plutot que de supprimer quand personne n est connecte', async () => {
    currentUser = null;

    const failure = await new Promise((resolve) =>
      service.deleteProfile().subscribe({ error: resolve }),
    );

    expect(failure).toBe('User not logged in');
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
