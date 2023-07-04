import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './multi.component.html',
  styleUrls: ['./multi.component.css']
})
export class MultiComponent implements OnInit {
  game!: string;

  constructor(private route : ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.game = params['game'];
    });
  }
}