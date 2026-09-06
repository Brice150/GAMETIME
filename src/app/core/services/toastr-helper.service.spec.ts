import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggingService } from './logging.service';
import { ToastrHelperService } from './toastr-helper.service';

describe('ToastrHelperService', () => {
  let service: ToastrHelperService;
  let toastr: { error: Mock; info: Mock; clear: Mock };
  let logError: Mock;
  let onHidden: Subject<void>;

  /** Le dernier message d'erreur affiche au joueur. */
  function lastError(): string {
    return toastr.error.mock.lastCall![0] as string;
  }

  beforeEach(() => {
    onHidden = new Subject<void>();
    logError = vi.fn();
    toastr = {
      error: vi.fn(),
      info: vi.fn(() => ({ toastId: 7, onHidden })),
      clear: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastrService, useValue: toastr },
        { provide: LoggingService, useValue: { logError } },
      ],
    });
    service = TestBed.inject(ToastrHelperService);
  });

  it('affiche une erreur sous le titre Erreur', () => {
    service.error('Boum');

    expect(toastr.error).toHaveBeenCalledWith(
      'Boum',
      'Erreur',
      expect.objectContaining({ positionClass: 'toast-bottom-center' }),
    );
  });

  it('affiche une information sous le titre demande', () => {
    service.info('Partie lancee', 'Salle');

    expect(toastr.info).toHaveBeenCalledWith(
      'Partie lancee',
      'Salle',
      expect.objectContaining({ positionClass: 'toast-bottom-center' }),
    );
  });

  it('traduit un code Firebase connu', () => {
    service.handleError({ code: 'auth/invalid-credential' });

    expect(lastError()).toBe('Identifiants incorrects');
  });

  it('reconnait un code porte par le message plutot que par le champ code', () => {
    service.handleError(new Error('Firebase: (auth/too-many-requests).'));

    expect(lastError()).toBe('Trop de tentatives, réessayez dans un instant');
  });

  it('remplace un code inconnu par un message generique', () => {
    service.handleError({ code: 'auth/quelque-chose-de-neuf' });

    expect(lastError()).toBe(
      'Une erreur est survenue, réessayez dans un instant',
    );
  });

  it('journalise toute erreur, meme celle qu il ne montre pas', () => {
    const error = { code: 'auth/popup-closed-by-user' };

    service.handleError(error);

    expect(logError).toHaveBeenCalledWith(error);
    expect(toastr.error).not.toHaveBeenCalled();
  });

  it('tait un refus de droits venu d une ecoute coupee', () => {
    service.handleError({ code: 'permission-denied' });

    expect(toastr.error).not.toHaveBeenCalled();
  });

  it('signale un refus de droits quand le joueur a clique pour agir', () => {
    service.handleError({ code: 'permission-denied' }, true);

    expect(lastError()).toBe(
      'Action refusée : droits insuffisants, reconnectez-vous puis réessayez',
    );
  });

  it('accepte une erreur sans code ni message', () => {
    service.handleError(undefined);

    expect(lastError()).toBe(
      'Une erreur est survenue, réessayez dans un instant',
    );
  });

  describe('proposition d installation', () => {
    /** Rejoue le clic du joueur sur un des deux boutons du toast. */
    function clickOn(className: string): void {
      const button = document.createElement('span');
      button.className = className;
      document.body.appendChild(button);
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.remove();
    }

    it('rend install quand le joueur accepte, et ferme le toast', () => {
      const seen: string[] = [];
      let done = false;
      service.installPrompt().subscribe({
        next: (action) => seen.push(action),
        complete: () => (done = true),
      });

      clickOn('toast-action');

      expect(seen).toEqual(['install']);
      expect(done).toBe(true);
      expect(toastr.clear).toHaveBeenCalledWith(7);
    });

    it('rend never quand le joueur refuse pour de bon', () => {
      const seen: string[] = [];
      service.installPrompt().subscribe((action) => seen.push(action));

      clickOn('toast-dismiss');

      expect(seen).toEqual(['never']);
    });

    it('ignore un clic ailleurs dans la page', () => {
      const seen: string[] = [];
      service.installPrompt().subscribe((action) => seen.push(action));

      clickOn('autre-chose');

      expect(seen).toEqual([]);
      expect(toastr.clear).not.toHaveBeenCalled();
    });

    it('ne rend rien quand le joueur ferme le toast sans repondre', () => {
      const seen: string[] = [];
      let done = false;
      service.installPrompt().subscribe({
        next: (action) => seen.push(action),
        complete: () => (done = true),
      });

      onHidden.next();

      expect(seen).toEqual([]);
      expect(done).toBe(true);
    });

    it('cesse d ecouter la page une fois le toast ferme', () => {
      const seen: string[] = [];
      service.installPrompt().subscribe((action) => seen.push(action));

      onHidden.next();
      clickOn('toast-action');

      expect(seen).toEqual([]);
    });
  });
});
