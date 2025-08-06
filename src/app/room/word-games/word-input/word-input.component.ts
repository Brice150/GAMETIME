import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Room } from 'src/app/core/interfaces/room';
import { WordTry } from 'src/app/core/interfaces/wordTry';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { emojies } from 'src/assets/data/emojis';

@Component({
  selector: 'app-word-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './word-input.component.html',
  styleUrls: ['./word-input.component.css'],
})
export class WordInputComponent implements OnInit {
  toastr = inject(ToastrService);
  localStorageService = inject(LocalStorageService);
  @Input() response: string = '';
  readonly room = input.required<Room>();
  wordToFind!: string;
  maxlength!: number;
  inputValue: string = '';
  tries: WordTry[] = [];
  @Output() emitEvent = new EventEmitter<boolean>();
  emojiClass: string = emojies[1].emojiClass;
  emojiStyle: { [klass: string]: any } = emojies[1].emojiStyle;
  isOver = false;

  ngOnInit(): void {
    if (this.response) {
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
        this.emojiClass = emojies[tries.length + 1].emojiClass;
        this.emojiStyle = emojies[tries.length + 1].emojiStyle;
      } else {
        this.localStorageService.newGame(roomId!, this.room().startAgainNumber);
        this.tries = [];
        this.emojiClass = emojies[1].emojiClass;
        this.emojiStyle = emojies[1].emojiStyle;
      }
      if (this.room().showFirstLetter) {
        this.wordToFind = this.response.replace(/[A-Za-z]/g, '_');
        this.inputValue = this.response.charAt(0);
      } else {
        this.wordToFind = this.response.replace(/[A-Za-z]/g, '_');
      }
      this.maxlength = this.response.length;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['response']?.firstChange) {
      this.ngOnInit();
    }
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
    if (this.inputValue) {
      this.inputValue = this.inputValue
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toUpperCase();
      const response = this.response;
      if (
        this.inputValue.length === this.maxlength &&
        (!this.room().showFirstLetter ||
          this.inputValue.startsWith(response.charAt(0))) &&
        /^[A-Z]+$/.test(this.inputValue)
      ) {
        if (this.inputValue === response) {
          this.reset(true);
        } else {
          this.addTry();
        }
      } else {
        this.toastr.error('Tentative invalide', 'Game Time', {
          positionClass: 'toast-bottom-center',
          toastClass: 'ngx-toastr custom error',
        });
      }
    } else {
      this.toastr.error('Tentative vide', 'Game Time', {
        positionClass: 'toast-bottom-center',
        toastClass: 'ngx-toastr custom error',
      });
    }

    this.inputValue = this.room().showFirstLetter
      ? this.response.charAt(0)
      : '';
  }

  addTry(): void {
    const newTry: WordTry = {
      letter: Array.from(this.inputValue!),
      isWellPlaced: Array.from(
        { length: this.inputValue!.length },
        () => false
      ),
      isWrongPlaced: Array.from(
        { length: this.inputValue!.length },
        () => false
      ),
    };

    const letterCountMap = new Map<string, number>();

    for (let letter of this.response) {
      letterCountMap.set(letter, (letterCountMap.get(letter) ?? 0) + 1);
    }

    for (let i = 0; i < this.inputValue!.length; i++) {
      const letter = this.inputValue![i];
      if (letter === this.response[i]) {
        newTry.isWellPlaced[i] = true;
        letterCountMap.set(letter, letterCountMap.get(letter)! - 1);
      }
    }

    for (let i = 0; i < this.inputValue!.length; i++) {
      const letter = this.inputValue![i];
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
    this.emojiClass = emojies[this.tries.length + 1].emojiClass;
    this.emojiStyle = emojies[this.tries.length + 1].emojiStyle;

    if (this.tries.length > 5) {
      this.reset(false);
    }
  }

  reset(stepWon: boolean) {
    const response: WordTry = {
      letter: Array.from(this.response),
      isWellPlaced: Array.from({ length: this.response!.length }, () => true),
      isWrongPlaced: Array.from({ length: this.response!.length }, () => false),
    };
    this.tries.push(response);
    this.isOver = true;
    setTimeout(() => {
      this.inputValue = '';
      this.localStorageService.saveTries([]);
    });
    this.emitEvent.emit(stepWon);
  }
}
