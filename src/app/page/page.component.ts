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
  isHovering: boolean[] = [true, false, false];
  
  ngOnInit() {
    let testValues = [13, 21, 3];
    localStorage.setItem('victoryNumber', JSON.stringify(testValues));

    let storedValue = localStorage.getItem('victoryNumber');
    if (storedValue !== null) {
      this.victoryNumber = JSON.parse(storedValue);
    } else {
      this.victoryNumber = [0, 0, 0];
    }
  }

  trigger(gameIndex: number) {
    this.isHovering.fill(false);
    this.isHovering[gameIndex] = true;
  }
}
