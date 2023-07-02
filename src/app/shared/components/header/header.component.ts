import { Component, Input } from '@angular/core';
import { Victories } from 'src/app/core/interfaces/victories';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() logo!: string;
  @Input() game!: string;
  @Input() medals!: number[];
}