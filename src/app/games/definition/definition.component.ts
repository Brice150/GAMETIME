import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  templateUrl: './definition.component.html',
  styleUrls: ['./definition.component.css']
})
export class DefinitionComponent implements OnInit {
  mode!: string;
  victory: number = 0;
  response!: string;

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'];
    });

    let storedValue = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      this.victory = JSON.parse(storedValue)[2];
    }
    
    this.newWord();
  }

  newWord() {
    let randomIndex = Math.floor(Math.random() * words.length);
    this.response = words[randomIndex];
  }

  handleWinEvent() {
    let storedValue: string | null = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      let victories: number[] = JSON.parse(storedValue);
      victories[2] = victories[2] + 1;
      localStorage.setItem('victoryNumber', JSON.stringify(victories));
      this.victory = victories[2];
    }
    this.newWord();
  }
}
