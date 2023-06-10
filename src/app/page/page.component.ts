import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent {
  imagePath: string = environment.imagePath;
  playerName: string = 'Brice';
  victoryNumber: number = 24;
  isHovering: boolean[] = [true, false, false];
  
  trigger(gameIndex: number) {
    this.isHovering.fill(false);
    this.isHovering[gameIndex] = true;
  }
}
