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
}