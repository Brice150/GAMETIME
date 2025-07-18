import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Games } from '../core/enums/games.enum';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  imagePath: string = environment.imagePath;
  games = Games;
  gameSelected: string = '';

  ngOnInit(): void {
    //TODO: get medals number
  }
}
