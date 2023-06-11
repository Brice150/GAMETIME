import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  imagePath: string = environment.imagePath;
  victoryNumber: number[] = [24, 2, 13];
  isHovering: boolean[] = [true, false, false];
  
  ngOnInit() {
    
  }

  trigger(gameIndex: number) {
    this.isHovering.fill(false);
    this.isHovering[gameIndex] = true;
  }
}
