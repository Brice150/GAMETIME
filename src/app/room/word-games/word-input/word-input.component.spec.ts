import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoundAnswer } from '../../../core/interfaces/round-answer';
import { Room } from '../../../core/interfaces/room';
import { WordTry } from '../../../core/interfaces/word-try';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';
import { WordInputComponent } from './word-input.component';

class LocalStorageStub {
  getTries(): null {
    return null;
  }
  getStartAgainNumber(): null {
    return null;
  }
  getRoomId(): string {
    return 'room-1';
  }
  newGame(): void {
    return undefined;
  }
  saveTries(): void {
    return undefined;
  }
  startTimer(): void {
    return undefined;
  }
}

const toastrStub = {
  info: (): void => undefined,
  error: (): void => undefined,
};

function buildRoom(showFirstLetter = false): Room {
  return {
    id: 'room-1',
    startAgainNumber: 0,
    showFirstLetter,
    responses: [],
  } as unknown as Room;
}

describe('WordInputComponent', () => {
  let fixture: ComponentFixture<WordInputComponent>;
  let component: WordInputComponent;

  async function build(response: string, showFirstLetter = false) {
    fixture = TestBed.createComponent(WordInputComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('room', buildRoom(showFirstLetter));
    fixture.componentRef.setInput('response', response);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordInputComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LocalStorageService, useClass: LocalStorageStub },
        { provide: ToastrHelperService, useValue: toastrStub },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('marque en vert les lettres bien placees', async () => {
    await build('CHAT');
    component.inputValue.set('CHUT');
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([true, true, false, true]);
    expect(lastTry.isWrongPlaced).toEqual([false, false, false, false]);
  });

  it('marque les lettres presentes mais mal placees', async () => {
    await build('CHAT');
    component.inputValue.set('TACH');
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([false, false, false, false]);
    expect(lastTry.isWrongPlaced).toEqual([true, true, true, true]);
  });

  it('ne signale pas plus d occurrences d une lettre que le mot n en contient', async () => {
    await build('ALLO');
    component.inputValue.set('LLLL');
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([false, true, true, false]);
    expect(lastTry.isWrongPlaced).toEqual([false, false, false, false]);
  });

  it('cumule les lettres trouvees d un essai a l autre', async () => {
    await build('CHAT');
    const found: number[] = [];
    component.progressEvent.subscribe((count) => found.push(count));

    component.inputValue.set('CHUT');
    component.addTry();
    component.inputValue.set('CXAT');
    component.addTry();

    expect(found).toEqual([3, 4]);
  });

  it('classe chaque lettre essayee : bien placee, mal placee ou exclue', async () => {
    await build('CHAT');
    component.inputValue.set('CHUT');
    component.addTry();

    const states = component.letterStates();
    expect(states['C']).toBe('wellPlaced');
    expect(states['H']).toBe('wellPlaced');
    expect(states['T']).toBe('wellPlaced');
    expect(states['U']).toBe('absent');
    expect(states['A']).toBeUndefined();
  });

  it('ne redescend pas une lettre deja trouvee bien placee', async () => {
    await build('CHAT');
    component.inputValue.set('CHUT');
    component.addTry();
    component.inputValue.set('TCHU');
    component.addTry();

    expect(component.letterStates()['C']).toBe('wellPlaced');
  });

  it('decompte les essais restants et durcit la couleur', async () => {
    await build('CHAT');
    expect(component.remainingAttempts).toBe(6);
    expect(component.attemptLevel).toBe('safe');

    const levels: string[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      component.inputValue.set('ZZZZ');
      component.addTry();
      levels.push(component.attemptLevel);
    }

    expect(levels).toEqual(['safe', 'warn', 'warn', 'alert', 'critical']);
    expect(component.remainingAttempts).toBe(1);
  });

  it('affiche le nombre restant et son accord', async () => {
    await build('CHAT');
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.status .remaining')
        .textContent.trim(),
    ).toBe('6');
    expect(
      fixture.nativeElement
        .querySelector('.status .attempt')
        .textContent.trim(),
    ).toBe('essais restants');

    for (let attempt = 0; attempt < 5; attempt++) {
      component.inputValue.set('ZZZZ');
      component.addTry();
    }
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.status .attempt')
        .textContent.trim(),
    ).toBe('essai restant');
  });

  it('affiche la bande alphabet avec l etat de chaque lettre', async () => {
    await build('CHAT');
    component.inputValue.set('CHUT');
    component.addTry();
    fixture.detectChanges();

    const keys: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.alphabet .key'),
    );
    expect(keys.length).toBe(26);

    const keyFor = (letter: string) =>
      keys.find((key) => key.textContent?.trim() === letter)!;
    expect(keyFor('C').classList).toContain('wellPlaced');
    expect(keyFor('U').classList).toContain('absent');
    expect(keyFor('B').classList.length).toBe(1);
  });

  // Le rendu ne distingue pas que par la couleur : chaque etat porte sa propre classe, a laquelle
  // la feuille de style attache une decoration differente (soulignement plein, pointille, barre).
  //
  // Que ces decorations soient bien appliquees et bien distinctes se verifie dans un vrai
  // navigateur : jsdom n'applique aucune feuille de style, et un `getComputedStyle` y renvoie la
  // meme chose pour les trois. Ce controle-la revient donc a la suite end to end. Ce qui suit
  // garantit ce qui peut l'etre ici : les trois etats sont bien rendus, et separement.
  it('marque chaque etat par une classe distincte', async () => {
    await build('CHAT');
    component.inputValue.set('CHUA');
    component.addTry();
    fixture.detectChanges();

    const states = ['wellPlaced', 'wrongPlaced', 'absent'];
    const keys = states.map((state) => {
      const key = fixture.nativeElement.querySelector(`.key.${state}`);
      expect(key, `aucune touche ${state}`).toBeTruthy();
      return key as HTMLElement;
    });

    // Aucune touche ne cumule deux etats : ils resteraient indistinguables.
    for (const key of keys) {
      const carried = states.filter((state) => key.classList.contains(state));
      expect(carried.length, key.textContent?.trim()).toBe(1);
    }
  });

  it('termine la manche sur une defaite au sixieme essai', async () => {
    await build('CHAT');
    let result: RoundAnswer | undefined;
    component.emitEvent.subscribe((round) => (result = round));

    for (let attempt = 0; attempt < 6; attempt++) {
      component.inputValue.set('ZZZZ');
      component.addTry();
    }

    // Le dernier mot saisi part au serveur, qui tranche.
    expect(result).toEqual({ won: false, answer: 'ZZZZ' });
    expect(component.isOver).toBe(true);
  });

  it('revele la reponse et signale la victoire', async () => {
    await build('CHAT');
    let result: RoundAnswer | undefined;
    component.emitEvent.subscribe((round) => (result = round));

    component.inputValue.set('CHAT');
    component.submitAnswer();

    expect(result).toEqual({ won: true, answer: 'CHAT' });
    expect(component.tries.at(-1)?.letter.join('')).toBe('CHAT');
  });

  it('prefixe la saisie de la premiere lettre quand l indice est actif', async () => {
    await build('CHAT', true);

    expect(component.inputValue()).toBe('C');
  });

  it('verrouille le champ sans lui retirer le curseur entre deux manches', async () => {
    await build('CHAT');
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(input.readOnly).toBe(false);

    component.inputValue.set('CHAT');
    component.submitAnswer();
    fixture.detectChanges();

    // Verrouille, mais toujours focalisable : le joueur n'a pas a recliquer
    // dedans a la manche suivante.
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
  });

  it('ignore une soumission une fois la manche jouee', async () => {
    await build('CHAT');
    const results: RoundAnswer[] = [];
    component.emitEvent.subscribe((round) => results.push(round));

    component.inputValue.set('CHAT');
    component.submitAnswer();
    component.inputValue.set('CHAT');
    component.submitAnswer();

    expect(results).toEqual([{ won: true, answer: 'CHAT' }]);
  });

  describe('saisie', () => {
    function press(key: string, value = ''): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      Object.defineProperty(event, 'target', { value: { value } });
      component.onKeyDown(event);
      return event;
    }

    it('n accepte que des lettres', async () => {
      await build('CHAT');

      expect(press('a').defaultPrevented).toBe(false);
      expect(press('Z').defaultPrevented).toBe(false);
      expect(press('4').defaultPrevented).toBe(true);
      expect(press('-').defaultPrevented).toBe(true);
      // Les touches d'edition portent un nom fait de lettres : elles passent
      // par la meme porte, et restent donc utilisables.
      expect(press('Backspace').defaultPrevented).toBe(false);
    });

    it('impose la premiere lettre quand l indice est actif', async () => {
      await build('CHAT', true);

      expect(press('H', '').defaultPrevented).toBe(true);
      expect(press('C', '').defaultPrevented).toBe(false);
      // Une fois la premiere lettre posee, la suite est libre.
      expect(press('H', 'C').defaultPrevented).toBe(false);
    });

    it('ote les accents et passe en majuscules', async () => {
      await build('CHAT');
      let result: RoundAnswer | undefined;
      component.emitEvent.subscribe((round) => (result = round));

      component.inputValue.set('chât');
      component.submitAnswer();

      expect(result).toEqual({ won: true, answer: 'CHAT' });
    });

    it('refuse une tentative vide', async () => {
      await build('CHAT');
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.inputValue.set('');
      component.submitAnswer();

      expect(error).toHaveBeenCalledWith('Tentative vide');
      expect(component.tries).toEqual([]);
    });

    it('refuse une tentative de mauvaise longueur', async () => {
      await build('CHAT');
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.inputValue.set('CHA');
      component.submitAnswer();

      expect(error).toHaveBeenCalledWith('Tentative invalide');
      expect(component.tries).toEqual([]);
    });

    it('refuse une tentative qui ignore la premiere lettre imposee', async () => {
      await build('CHAT', true);
      const error = vi.spyOn(component.toastrHelper, 'error');

      component.inputValue.set('HAT1');
      component.submitAnswer();

      expect(error).toHaveBeenCalledWith('Tentative invalide');
      // Le champ repart de la premiere lettre.
      expect(component.inputValue()).toBe('C');
    });

    it('enregistre une tentative valide qui n est pas la bonne', async () => {
      await build('CHAT');
      const save = vi.spyOn(component.localStorageService, 'saveTries');

      component.inputValue.set('CHUT');
      component.submitAnswer();

      expect(component.tries.length).toBe(1);
      expect(save).toHaveBeenCalled();
      expect(component.inputValue()).toBe('');
    });
  });

  describe('reprise d une manche', () => {
    it('reprend les essais enregistres pour cette room', async () => {
      const saved: WordTry[] = [
        {
          letter: ['C', 'H', 'U', 'T'],
          isWellPlaced: [true, true, false, true],
          isWrongPlaced: [false, false, false, false],
        },
      ];
      TestBed.overrideProvider(LocalStorageService, {
        useValue: {
          ...new LocalStorageStub(),
          getTries: () => saved,
          getStartAgainNumber: () => 0,
          getRoomId: () => 'room-1',
        },
      });

      await build('CHAT');

      expect(component.tries).toEqual(saved);
      expect(component.letterStates()['C']).toBe('wellPlaced');
    });

    it('repart de zero quand les essais viennent d une autre partie', async () => {
      const newGame = vi.fn();
      TestBed.overrideProvider(LocalStorageService, {
        useValue: {
          ...new LocalStorageStub(),
          getTries: () => [],
          getStartAgainNumber: () => 4,
          getRoomId: () => 'room-1',
          newGame,
        },
      });

      await build('CHAT');

      expect(component.tries).toEqual([]);
      expect(newGame).toHaveBeenCalledWith('room-1', 0);
    });

    it('ne prepare rien tant que le mot n est pas connu', async () => {
      await build('');

      expect(component.tries).toEqual([]);
      expect(component.wordToFind).toBeUndefined();
    });
  });
});
