import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Room } from '../../../core/interfaces/room';
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

  it('distingue les etats autrement que par la couleur', async () => {
    await build('CHAT');
    component.inputValue.set('CHUA');
    component.addTry();
    fixture.detectChanges();

    const decoration = (selector: string) => {
      const style = getComputedStyle(
        fixture.nativeElement.querySelector(selector) as HTMLElement,
      );
      return `${style.textDecorationLine} ${style.textDecorationStyle}`;
    };

    // Trois signatures distinctes, lisibles sans percevoir la couleur.
    const signatures = new Set([
      decoration('.key.wellPlaced'),
      decoration('.key.wrongPlaced'),
      decoration('.key.absent'),
    ]);
    expect(signatures.size).toBe(3);
  });

  it('termine la manche sur une defaite au sixieme essai', async () => {
    await build('CHAT');
    let result: boolean | undefined;
    component.emitEvent.subscribe((won) => (result = won));

    for (let attempt = 0; attempt < 6; attempt++) {
      component.inputValue.set('ZZZZ');
      component.addTry();
    }

    expect(result).toBe(false);
    expect(component.isOver).toBe(true);
  });

  it('revele la reponse et signale la victoire', async () => {
    await build('CHAT');
    let result: boolean | undefined;
    component.emitEvent.subscribe((won) => (result = won));

    component.inputValue.set('CHAT');
    component.submitAnswer();

    expect(result).toBe(true);
    expect(component.tries.at(-1)?.letter.join('')).toBe('CHAT');
  });

  it('prefixe la saisie de la premiere lettre quand l indice est actif', async () => {
    await build('CHAT', true);

    expect(component.inputValue()).toBe('C');
  });
});
