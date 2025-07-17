import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserService } from '../core/services/user.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  readonly logo = input.required<string>();
  readonly gameName = input.required<string>();
  userService = inject(UserService);

  getMedalsNumber(): number {
    if (this.gameName() === 'motus') {
      return this.userService
        .user()
        .stats.filter((stat) => stat.game === 'motus')[0]?.medalsNumer;
    } else if (this.gameName() === 'drapeau') {
      return this.userService
        .user()
        .stats.filter((stat) => stat.game === 'flag')[0]?.medalsNumer;
    }
    return 0;
  }
}
