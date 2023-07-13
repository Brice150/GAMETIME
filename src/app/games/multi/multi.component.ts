import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './multi.component.html',
  styleUrls: ['./multi.component.css']
})
export class MultiComponent implements OnInit {
  game!: string;

  constructor(
    private route : ActivatedRoute,
    private toastr: ToastrService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.game = params['game'];
    });
    this.toastr.error("Travail en cours...", "Multijoueur", {
      positionClass: "toast-bottom-center" 
    });
  }
}