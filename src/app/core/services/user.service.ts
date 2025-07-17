import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user = signal<User>(this.getInitialUser());

  private getInitialUser(): User {
    const storedUser: string | null = localStorage.getItem('gameTimeUser');
    if (storedUser !== null) {
      return JSON.parse(storedUser);
    } else {
      return this.createDefaultUser();
    }
  }

  setDefaultUser(): User {
    const defaultUser = this.createDefaultUser();
    localStorage.setItem('gameTimeUser', JSON.stringify(defaultUser));
    this.user.set(defaultUser);
    return defaultUser;
  }

  private createDefaultUser(): User {
    const motusStat = {
      game: 'motus',
      medalsNumer: 0,
    };

    const flagStat = {
      game: 'flag',
      medalsNumer: 0,
    };

    const randomString = uuidv4().substring(0, 4);
    const username = `User#${randomString}`;

    return {
      username: username,
      stats: [motusStat, flagStat],
    };
  }

  addMedalToGame(gameName: string): void {
    const user = this.user();
    const gameStat = user.stats.find((stat) => stat.game === gameName);
    if (gameStat) {
      gameStat.medalsNumer += 1;
      localStorage.setItem('gameTimeUser', JSON.stringify(user));
      this.user.set({ ...user });
    }
  }
}
