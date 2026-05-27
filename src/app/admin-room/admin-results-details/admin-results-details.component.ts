import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';

@Component({
  selector: 'app-admin-results-details',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-results-details.component.html',
  styleUrls: ['./admin-results-details.component.css'],
})
export class AdminResultsDetailsComponent {
  @Input() room!: Room;
  @Input() players: Player[] = [];
  hideResults = true;
}
