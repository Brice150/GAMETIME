import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Victories } from '../core/interfaces/victories';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  imagePath: string = environment.imagePath;
  victories!: Victories;
  isActive: boolean[] = [true, false];
  
  ngOnInit() {
    let storedValue = localStorage.getItem('victories');
    if (storedValue !== null) {
      this.victories = JSON.parse(storedValue);
    } else {
      this.victories = {
        game: ['motus', 'flag'],
        gold: [0, 0],
        silver: [0, 0]
      };
      localStorage.setItem('victories', JSON.stringify(this.victories));
    }
  }

  trigger(gameIndex: number) {
    this.isActive.fill(false);
    this.isActive[gameIndex] = true;
  }
}
