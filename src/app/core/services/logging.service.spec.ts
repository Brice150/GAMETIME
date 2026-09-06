import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';
import { UserService } from './user.service';

// Firestore est remplace au niveau du module : le service appelle `addDoc` directement, sans
// passer par une dependance qu'un fournisseur pourrait doubler.
const addDoc = vi.fn(
  (collection: { path: string }, data: Record<string, unknown>) =>
    Promise.resolve({ collection, data }),
);
vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  addDoc: (collection: { path: string }, data: Record<string, unknown>) =>
    addDoc(collection, data),
  collection: (_firestore: unknown, path: string) => ({ path }),
  serverTimestamp: () => 'timestamp',
}));

describe('LoggingService', () => {
  let service: LoggingService;
  let currentUser: { uid: string; email: string | null } | null;
  let production: boolean;

  /** Le document que le service a voulu ecrire. */
  function written(): Record<string, unknown> {
    return addDoc.mock.lastCall![1];
  }

  function build(): LoggingService {
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
    return TestBed.inject(LoggingService);
  }

  beforeEach(() => {
    (addDoc as Mock).mockClear();
    currentUser = { uid: 'u1', email: 'joueur@example.com' };
    production = environment.production;
    // Hors production le service se tait : les tests portent sur ce qu'il fait en production.
    (environment as { production: boolean }).production = true;
    service = build();
  });

  afterEach(() => {
    (environment as { production: boolean }).production = production;
  });

  it('ne journalise rien hors production', () => {
    (environment as { production: boolean }).production = false;

    service.logError(new Error('Boum'));

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('journalise une erreur avec son message, sa pile et le compte connecte', () => {
    service.logError(new Error('Boum'));

    expect(written()).toMatchObject({
      message: 'Boum',
      userId: 'u1',
      email: 'joueur@example.com',
    });
    expect(written()['stack']).toContain('Boum');
  });

  it('retombe sur le nom quand l erreur n a pas de message', () => {
    const error = new Error('');
    error.name = 'TypeError';

    service.logError(error);

    expect(written()['message']).toBe('TypeError');
  });

  it('journalise une chaine telle quelle', () => {
    service.logError('quelque chose a casse');

    expect(written()).toMatchObject({
      message: 'quelque chose a casse',
      stack: null,
    });
  });

  it('serialise un objet qui n est pas une erreur', () => {
    service.logError({ code: 42 });

    expect(written()['message']).toBe('{"code":42}');
  });

  it('retombe sur la conversion en texte quand la serialisation boucle', () => {
    const looping: Record<string, unknown> = {};
    looping['self'] = looping;

    service.logError(looping);

    expect(written()['message']).toBe('[object Object]');
  });

  it('ne journalise pas le bruit de fonctionnement', () => {
    service.logError(new Error('Missing or insufficient permissions.'));
    service.logError(new Error('Loading chunk 42 failed'));
    service.logError({ code: 'auth/popup-closed-by-user', message: '' });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('ne journalise qu une fois une erreur qui se repete', () => {
    // Deux `new Error` distincts porteraient deux piles : c'est bien la meme erreur qui revient.
    const error = new Error('Boum');

    service.logError(error);
    service.logError(error);

    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  it('vide sa memoire une fois la limite atteinte, et rejournalise', () => {
    const first = new Error('erreur 0');
    service.logError(first);

    // La centieme erreur distincte vide la memoire : la premiere n'y est plus.
    for (let i = 1; i <= 100; i++) {
      service.logError(new Error(`erreur ${i}`));
    }
    (addDoc as Mock).mockClear();

    service.logError(first);

    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  it('journalise sans compte quand personne n est connecte', () => {
    currentUser = null;

    service.logError(new Error('Boum'));

    expect(written()).toMatchObject({ userId: null, email: null });
  });

  it('tronque un message trop long', () => {
    service.logError(new Error('x'.repeat(2000)));

    expect((written()['message'] as string).length).toBe(1000);
  });
});
