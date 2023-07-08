import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Try } from 'src/app/core/interfaces/try';
import { emojies } from '../../data/emojis';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-main-input',
  templateUrl: './main-input.component.html',
  styleUrls: ['./main-input.component.css']
})
export class MainInputComponent implements OnInit {
  @Input() response!: string;
  @Input() showFirstLetter: boolean = true;
  @Input() gameName!: string;
  wordToFind!: string;
  maxlength!: number;
  inputValue!: string | null;
  tries: Try[] = [];
  @Output() winEvent = new EventEmitter<number>();
  @Output() lostEvent = new EventEmitter<void>();
  emojiClass: string = emojies[1].emojiClass;
  emojiStyle: { [klass: string]: any; } = emojies[1].emojiStyle;

  constructor(private toastr: ToastrService) {}

  ngOnInit() {
    if (this.response) {
      if (this.showFirstLetter) {
        this.wordToFind = this.response.charAt(0).toLowerCase() + this.response.slice(1).replace(/[A-Za-z]/g, "_");
      }
      else {
        this.wordToFind = this.response.replace(/[A-Za-z]/g, "_");
      }
      this.maxlength = this.response.length;
    }
  }

  ngOnChanges(changes: SimpleChanges) {  
    if (!changes['response'].firstChange) {
      this.ngOnInit();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const isAllowedCharacter = /^[A-Za-z]+$/.test(key);
  
    if (!isAllowedCharacter) {
      event.preventDefault();
    }

    if (this.showFirstLetter) {
      const inputValue = (event.target as HTMLInputElement).value;
      if (inputValue.length === 0 && key !== this.response.charAt(0).toLowerCase()) {
        event.preventDefault();
      }
    }
  }

  submitAnswer() {
    if (this.inputValue && this.inputValue.length === this.maxlength) {
      if (this.inputValue.toLowerCase() === this.response.toLowerCase()) {
        this.reset(true);
      }
      else {
        this.addTry();        
      }
      this.inputValue = null;
    }
  }

  addTry() {
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
    this.emojiClass = emojies[this.tries.length+1].emojiClass;
    this.emojiStyle = emojies[this.tries.length+1].emojiStyle;
    if (this.tries.length > 5) {
      this.reset(false);
    }
  }

  reset(gameWon: boolean) {
    let medalsWon: number = 1;
    if (this.tries.length < 2) {
      medalsWon = 3;
    }
    else if (this.tries.length < 4) {
      medalsWon = 2;
    }
    const response: Try = {
      letter: Array.from(this.response),
      isRed: Array.from({ length: this.response!.length }, () => true),
      isYellow: Array.from({ length: this.response!.length }, () => false)
    };
    this.tries = [];
    this.tries.push(response);
    if (gameWon) {
      this.toastr.success("You won", this.gameName.toUpperCase(), {
        positionClass: "toast-bottom-center" 
      });
    }
    else {
      this.toastr.error("You lost", this.gameName.toUpperCase(), {
        positionClass: "toast-bottom-center" 
      });
    }
    setTimeout(() => {
      if (gameWon) {
        this.winEvent.emit(medalsWon);
      }
      else {
        this.lostEvent.emit();
      }
      this.tries = [];
      this.emojiClass = emojies[1].emojiClass;
      this.emojiStyle = emojies[1].emojiStyle;
    }, 2000);
  }
}