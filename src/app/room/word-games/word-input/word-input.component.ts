import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  input,
  OnChanges,
  ElementRef,
  Injector,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoundAnswer } from '../../../core/interfaces/round-answer';
import { Room } from '../../../core/interfaces/room';
import { WordTry } from '../../../core/interfaces/word-try';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';

const MAX_TRIES = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export type LetterState = 'wellPlaced' | 'wrongPlaced' | 'absent';

@Component({
  selector: 'app-word-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './word-input.component.html',
  styleUrls: ['./word-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordInputComponent implements OnInit, OnChanges {
  toastrHelper = inject(ToastrHelperService);
  localStorageService = inject(LocalStorageService);
  private injector = inject(Injector);
  @Input() response = '';
  readonly room = input.required<Room>();
  wordToFind!: string;
  maxlength!: number;
  readonly inputValue = signal('');
  tries: WordTry[] = [];
  @Output() emitEvent = new EventEmitter<RoundAnswer>();
  @Output() progressEvent = new EventEmitter<number>();
  isOver = false;
  readonly maxTries = MAX_TRIES;
  readonly alphabet = ALPHABET;
  // Etat connu de chaque lettre de l alphabet : sans ce recapitulatif, il faut
  // relire toutes les lignes precedentes pour savoir ce qui est deja exclu.
  readonly letterStates = signal<Record<string, LetterState>>({});
  private foundPositions = new Set<number>();
  @ViewChild('answerInput') answerInput?: ElementRef<HTMLInputElement>;

  get remainingAttempts(): number {
    return Math.max(MAX_TRIES - this.tries.length, 0);
  }

  // Le smiley disait l humeur, pas le nombre d essais. La couleur passe du
  // vert au rouge a mesure qu ils s epuisent, via les jetons du theme pour
  // rester lisible en clair comme en sombre.
  get attemptLevel(): string {
    const remaining = this.remainingAttempts;

    if (remaining >= 5) {
      return 'safe';
    }
    if (remaining >= 3) {
      return 'warn';
    }
    if (remaining === 2) {
      return 'alert';
    }
    return 'critical';
  }

  ngOnInit(): void {
    this.startRound();
  }

  // Seul un changement de mot relance la manche : reagir a `room` remettait a
  // zero la saisie en cours.
  ngOnChanges(changes: SimpleChanges): void {
    const responseChange = changes['response'];

    if (!responseChange || responseChange.firstChange) {
      return;
    }

    this.startRound();
  }

  private startRound(): void {
    if (!this.response) {
      return;
    }

    this.isOver = false;
    this.response = this.response.toUpperCase();
    const tries = this.localStorageService.getTries();
    const startAgainNumber = this.localStorageService.getStartAgainNumber();
    const roomId = this.localStorageService.getRoomId();

    if (
      tries &&
      startAgainNumber !== undefined &&
      roomId &&
      roomId === this.room().id &&
      this.room().startAgainNumber === startAgainNumber
    ) {
      this.tries = tries;
    } else {
      this.localStorageService.newGame(roomId!, this.room().startAgainNumber);
      this.tries = [];
    }

    this.wordToFind = this.response.replace(/[A-Za-z]/g, '_');

    if (this.room().showFirstLetter) {
      this.inputValue.set(this.response.charAt(0));
    }

    this.maxlength = this.response.length;
    this.refreshProgress();
    this.focusInput();
  }

  // La manche s enchaine seule : sans ce rappel du focus, le joueur devait
  // recliquer dans le champ a chaque mot.
  private focusInput(): void {
    // Apres le rendu : le champ n'est pas encore dans le DOM a la premiere
    // manche, un focus immediat serait sans effet.
    afterNextRender(() => this.answerInput?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  private refreshProgress(): void {
    this.foundPositions = new Set<number>();
    const states: Record<string, LetterState> = {};

    for (const previousTry of this.tries) {
      previousTry.letter.forEach((letter, index) => {
        if (previousTry.isWellPlaced[index]) {
          this.foundPositions.add(index);
          states[letter] = 'wellPlaced';
        } else if (previousTry.isWrongPlaced[index]) {
          // Une lettre bien placee ailleurs ne redescend pas.
          if (states[letter] !== 'wellPlaced') {
            states[letter] = 'wrongPlaced';
          }
        } else if (!states[letter]) {
          states[letter] = 'absent';
        }
      });
    }

    this.letterStates.set(states);
    this.progressEvent.emit(this.foundPositions.size);
  }

  onKeyDown(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    const isAllowedCharacter = /^[A-Z]+$/.test(key);

    if (!isAllowedCharacter) {
      event.preventDefault();
    }

    if (this.room().showFirstLetter) {
      const inputValue = (event.target as HTMLInputElement).value;
      if (inputValue.length === 0 && key !== this.response.charAt(0)) {
        event.preventDefault();
      }
    }
  }

  submitAnswer(): void {
    // Le champ garde le curseur entre deux manches : « Entree » y arrive
    // encore, alors que la manche est deja jouee.
    if (this.isOver) {
      return;
    }

    if (this.inputValue()) {
      this.inputValue.set(
        this.inputValue()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase(),
      );
      const response = this.response;
      const value = this.inputValue();
      if (
        value.length === this.maxlength &&
        (!this.room().showFirstLetter ||
          value.startsWith(response.charAt(0))) &&
        /^[A-Z]+$/.test(value)
      ) {
        if (value === response) {
          this.reset(true, value);
        } else {
          this.addTry();
        }
      } else {
        this.toastrHelper.error('Tentative invalide');
      }
    } else {
      this.toastrHelper.error('Tentative vide');
    }

    this.inputValue.set(
      this.room().showFirstLetter ? this.response.charAt(0) : '',
    );
  }

  addTry(): void {
    const value = this.inputValue();
    const newTry: WordTry = {
      letter: Array.from(value),
      isWellPlaced: Array.from({ length: value.length }, () => false),
      isWrongPlaced: Array.from({ length: value.length }, () => false),
    };

    const letterCountMap = new Map<string, number>();

    for (const letter of this.response) {
      letterCountMap.set(letter, (letterCountMap.get(letter) ?? 0) + 1);
    }

    for (let i = 0; i < value.length; i++) {
      const letter = value[i];
      if (letter === this.response[i]) {
        newTry.isWellPlaced[i] = true;
        letterCountMap.set(letter, letterCountMap.get(letter)! - 1);
      }
    }

    for (let i = 0; i < value.length; i++) {
      const letter = value[i];
      if (
        !newTry.isWellPlaced[i] &&
        letterCountMap.get(letter) &&
        this.response.includes(letter)
      ) {
        newTry.isWrongPlaced[i] = true;
        letterCountMap.set(letter, letterCountMap.get(letter)! - 1);
      }
    }

    this.tries.push(newTry);
    this.localStorageService.saveTries(this.tries);
    this.refreshProgress();

    if (this.tries.length >= MAX_TRIES) {
      this.reset(false, value);
    }
  }

  // `answer` est le dernier mot soumis : c'est lui que le serveur compare au
  // mot de la manche pour trancher, le client n'etant pas cru sur parole.
  reset(stepWon: boolean, answer: string) {
    const response: WordTry = {
      letter: Array.from(this.response),
      isWellPlaced: Array.from({ length: this.response!.length }, () => true),
      isWrongPlaced: Array.from({ length: this.response!.length }, () => false),
    };
    this.tries.push(response);
    this.isOver = true;
    setTimeout(() => {
      this.inputValue.set('');
      this.localStorageService.saveTries([]);
    });
    this.emitEvent.emit({ won: stepWon, answer });
  }
}
