import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Try } from 'src/app/core/interfaces/try';

@Component({
  selector: 'app-main-input',
  templateUrl: './main-input.component.html',
  styleUrls: ['./main-input.component.css']
})
export class MainInputComponent implements OnInit {
  @Input() response!: string;
  wordToFind!: string;
  maxlength!: number;
  inputValue!: string | null;
  tries: Try[] = [];
  @Output() winEvent = new EventEmitter<void>();

  ngOnInit() {
    if (this.response) {
      this.wordToFind = this.response.replace(/[A-Za-z]/g, "_");
      this.maxlength = this.response.length;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const isAllowedCharacter = /^[A-Za-z]+$/.test(key);
  
    if (!isAllowedCharacter) {
      event.preventDefault();
    }
  }

  submitForm() {
    if (this.inputValue && this.inputValue.length === this.maxlength) {
      if (this.inputValue.toLocaleLowerCase() === this.response.toLocaleLowerCase()) {
        this.winEvent.emit();
        this.tries = [];
      }
      else {
        this.createTry();
      }
      this.inputValue = null;
    }
  }

  createTry() {
    const newTry: Try = {
      letter: Array.from(this.inputValue!),
      isRed: Array.from({ length: this.inputValue!.length }, () => false),
      isYellow: Array.from({ length: this.inputValue!.length }, () => false)
    };
    const letterCountMap = new Map<string, number>();
    for (let letter of this.response) {
      if (letterCountMap.has(letter)) {
        letterCountMap.set(letter, letterCountMap.get(letter)! + 1);
      } else {
        letterCountMap.set(letter, 1);
      }
    }
    for (let i = 0; i < this.inputValue!.length; i++) {
      let letter = this.inputValue![i];
      if (letter === this.response[i]) {
        letterCountMap.set(letter, letterCountMap.get(letter)! - 1);
        newTry.isRed[i] = true;
      }
    }
    for (let i = 0; i < this.inputValue!.length; i++) {  
      let letter = this.inputValue![i];
      if (this.response.includes(letter) && letterCountMap.get(letter) !== 0) {
          letterCountMap.set(letter, letterCountMap.get(letter)! - 1);
          newTry.isYellow[i] = true;
      }
    }
    this.tries.push(newTry);
  }
}