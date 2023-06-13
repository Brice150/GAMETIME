import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { words } from 'src/app/shared/data/words';

@Component({
  selector: 'app-root',
  templateUrl: './motus.component.html',
  styleUrls: ['./motus.component.css']
})
export class MotusComponent implements OnInit {
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
      this.victory = JSON.parse(storedValue)[0];
    }

    let randomIndex = Math.floor(Math.random() * words.length);
    this.response = words[randomIndex];
  }
}