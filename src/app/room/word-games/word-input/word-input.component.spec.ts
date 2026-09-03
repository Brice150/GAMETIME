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
        { provide: LocalStorageService, useClass: LocalStorageStub },
        { provide: ToastrHelperService, useValue: toastrStub },
      ],
    }).compileComponents();
  });

  it('marque en vert les lettres bien placees', async () => {
    await build('CHAT');
    component.inputValue = 'CHUT';
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([true, true, false, true]);
    expect(lastTry.isWrongPlaced).toEqual([false, false, false, false]);
  });

  it('marque les lettres presentes mais mal placees', async () => {
    await build('CHAT');
    component.inputValue = 'TACH';
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([false, false, false, false]);
    expect(lastTry.isWrongPlaced).toEqual([true, true, true, true]);
  });

  it('ne signale pas plus d occurrences d une lettre que le mot n en contient', async () => {
    await build('ALLO');
    component.inputValue = 'LLLL';
    component.addTry();

    const lastTry = component.tries[0];
    expect(lastTry.isWellPlaced).toEqual([false, true, true, false]);
    expect(lastTry.isWrongPlaced).toEqual([false, false, false, false]);
  });

  it('cumule les lettres trouvees d un essai a l autre', async () => {
    await build('CHAT');
    const found: number[] = [];
    component.progressEvent.subscribe((count) => found.push(count));

    component.inputValue = 'CHUT';
    component.addTry();
    component.inputValue = 'CXAT';
    component.addTry();

    expect(found).toEqual([3, 4]);
  });

  it('termine la manche sur une defaite au sixieme essai', async () => {
    await build('CHAT');
    let result: boolean | undefined;
    component.emitEvent.subscribe((won) => (result = won));

    for (let attempt = 0; attempt < 6; attempt++) {
      component.inputValue = 'ZZZZ';
      component.addTry();
    }

    expect(result).toBe(false);
    expect(component.isOver).toBe(true);
  });

  it('revele la reponse et signale la victoire', async () => {
    await build('CHAT');
    let result: boolean | undefined;
    component.emitEvent.subscribe((won) => (result = won));

    component.inputValue = 'CHAT';
    component.submitAnswer();

    expect(result).toBe(true);
    expect(component.tries.at(-1)?.letter.join('')).toBe('CHAT');
  });

  it('prefixe la saisie de la premiere lettre quand l indice est actif', async () => {
    await build('CHAT', true);

    expect(component.inputValue).toBe('C');
  });
});
