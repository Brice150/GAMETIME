import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { NumberTry } from 'src/app/core/interfaces/numberTry';
import { emojies } from '../../data/emojis';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-number-input',
  templateUrl: './number-input.component.html',
  styleUrls: ['./number-input.component.css']
})
export class NumberInputComponent implements OnInit {
  @Input() response!: string;
  @Input() gameName!: string;
  wordToFind!: string;
  maxlength!: number;
  inputValue!: string | null;
  tries: NumberTry[] = [];
  @Output() winEvent = new EventEmitter<number>();
  @Output() lostEvent = new EventEmitter<void>();
  emojiClass: string = emojies[1].emojiClass;
  emojiStyle: { [klass: string]: any; } = emojies[1].emojiStyle;
  isSecondChance: boolean = false;
  tryCount: number = 1;

  constructor(private toastr: ToastrService) {}

  ngOnInit() {
    if (this.response) {
      this.tries = [];
      this.emojiClass = emojies[1].emojiClass;
      this.emojiStyle = emojies[1].emojiStyle;
      this.tryCount = 1;
      this.isSecondChance = false;
      this.maxlength = this.response.length;
      this.wordToFind = this.response.replace(/[0-9]/g, "_");
    }
  }

  ngOnChanges(changes: SimpleChanges) {  
    if (!changes['response'].firstChange) {
      this.ngOnInit();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const isNumberKey = /^\d$/.test(key);
    const isBackspaceKey = key === 'Backspace';
    const isEnterKey = key === 'Enter';
  
    if (!(isNumberKey || isBackspaceKey || isEnterKey || event.code.includes('Arrow'))) {
      event.preventDefault();
    }
  }

  submitAnswer() {
    let inputValueAsNumber = parseInt(this.inputValue!);
    const remainder = inputValueAsNumber % 5;
    inputValueAsNumber -= remainder;
    if (remainder > 2) {
      inputValueAsNumber += 5;
    }
    this.inputValue = inputValueAsNumber.toString();
    if (this.inputValue) {
      if (this.inputValue.length === this.maxlength
        && !isNaN(inputValueAsNumber)) {
        if (this.inputValue === this.response) {
          this.reset(true);
        }
        else {
          this.addTry();        
        }
      }
      else {
        this.toastr.error("Tentative invalide", this.gameName.toUpperCase(), {
          positionClass: "toast-top-center" 
        });
      }
    }
    else {
      this.toastr.error("Tentative vide", this.gameName.toUpperCase(), {
        positionClass: "toast-top-center" 
      });
    }
    this.inputValue = null;
  }

  addTry() {
    let inputValueAsNumber: number = parseInt(this.inputValue!);
    const responseAsNumber: number = parseInt(this.response!);
    if (inputValueAsNumber === 0) {
      inputValueAsNumber = 1;
    }
    const gapPerCentValue: number = parseInt(
      ((Math.abs(responseAsNumber - inputValueAsNumber) / inputValueAsNumber) * 100).toFixed(0)
    );
    const newTry: NumberTry = {
      number: this.inputValue!,
      isGreater: this.inputValue! < this.response,
      isBigGap: gapPerCentValue > 50,
      isCloseGap: gapPerCentValue < 20,
      isResult: false
    };
    this.tries.push(newTry);
    if (this.isSecondChance) {
      this.tryCount +=1 ;
      this.emojiClass = emojies[this.tryCount].emojiClass;
      this.emojiStyle = emojies[this.tryCount].emojiStyle;
      this.isSecondChance = false;
    }
    else {
      this.isSecondChance = true;
    }
    if (this.tries.length > 11) {
      this.reset(false);
    }
  }

  reset(gameWon: boolean) {
    const response: NumberTry = {
      number: this.response,
      isGreater: false,
      isBigGap: false,
      isCloseGap: false,
      isResult: true
    };
    this.tries = [];
    this.tries.push(response);
    if (gameWon) {
      this.toastr.success("Gagné", this.gameName.toUpperCase(), {
        positionClass: "toast-top-center" 
      });
    }
    else {
      this.toastr.error("Perdu", this.gameName.toUpperCase(), {
        positionClass: "toast-top-center" 
      });
    }
    setTimeout(() => {
      if (gameWon) {
        this.winEvent.emit();
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