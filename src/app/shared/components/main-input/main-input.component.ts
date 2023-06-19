import { Component, Input, OnInit } from '@angular/core';

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
  tries: string[][] = [];

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
      if (this.inputValue === this.response) {
        console.log("You win");
      }
      this.tries.push(Array.from(this.inputValue));
      this.inputValue = null;
    }
  }

  getLetterStyle(letter: string, i: number) {
    if (this.response[i] == letter.toLowerCase()) {
      return {
        'color': 'red'
      };
    }
    else if (this.response.includes(letter.toLowerCase())) {
      return {
        'color': 'yellow'
      };
    } else {
      return {};
    }
  }
}