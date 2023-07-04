import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../core/interfaces/user';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  imagePath: string = environment.imagePath;
  isActive: boolean[] = [true, false, false];
  user: User = {} as User;
  
  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    } else {
      const randomString = uuidv4().substring(0,4);
      this.user.username = `User#${randomString}`;
      this.user.victories = {
        game: ['motus', 'flag'],
        gold: [0, 0],
        silver: [0, 0]
      };
      localStorage.setItem('user', JSON.stringify(this.user));
    }    
  }

  trigger(gameIndex: number) {
    this.isActive.fill(false);
    this.isActive[gameIndex] = true;
  }
}
