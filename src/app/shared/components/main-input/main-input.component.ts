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
  tries: string[] = [];

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
      else {
        let letters = [];
        for (let i = 0; i < this.response.length; i++) {
          if (this.inputValue.includes(this.response[i])) {
            letters.push(this.response[i]);
          }
        }
        console.log(letters);
      }
      this.tries.push(this.inputValue);
      this.inputValue = null;
    }
  }
}