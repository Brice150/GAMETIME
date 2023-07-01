import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  imagePath: string = environment.imagePath;
  victoryNumber: number[] = [];
  isActive: boolean[] = [true, false, false];
  
  ngOnInit() {
    let storedValue = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      this.victoryNumber = JSON.parse(storedValue);
    } else {
      this.victoryNumber = [0, 0, 0];
      localStorage.setItem('victoryNumber', JSON.stringify(this.victoryNumber));
    }
  }

  trigger(gameIndex: number) {
    this.isActive.fill(false);
    this.isActive[gameIndex] = true;
  }
}
