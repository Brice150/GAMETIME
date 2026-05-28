import { inject, Injectable } from '@angular/core';
import { WordTry } from '../interfaces/word-try';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  userService = inject(UserService);
  private readonly triesKey = 'tries';
  private readonly startAgainKey = 'startAgainNumber';
  private readonly roomIdKey = 'roomId';

  private getScopedKey(baseKey: string): string {
    const userId = this.userService.auth.currentUser?.uid ?? 'anonymous';
    return `${baseKey}:${userId}`;
  }

  saveTries(value: WordTry[]): void {
    localStorage.setItem(
      this.getScopedKey(this.triesKey),
      JSON.stringify(value),
    );
  }

  getTries(): WordTry[] | null {
    const item = localStorage.getItem(this.getScopedKey(this.triesKey));
    if (!item) return null;
    try {
      return JSON.parse(item) as WordTry[];
    } catch {
      return null;
    }
  }

  saveStartAgainNumber(value: number): void {
    localStorage.setItem(
      this.getScopedKey(this.startAgainKey),
      value.toString(),
    );
  }

  getStartAgainNumber(): number | null {
    const item = localStorage.getItem(this.getScopedKey(this.startAgainKey));
    if (!item) return null;
    const parsed = parseInt(item, 10);
    return isNaN(parsed) ? null : parsed;
  }

  saveRoomId(value: string): void {
    localStorage.setItem(this.getScopedKey(this.roomIdKey), value);
  }

  getRoomId(): string | null {
    const item = localStorage.getItem(this.getScopedKey(this.roomIdKey));
    if (!item) return null;
    return item;
  }

  newGame(roomId: string, startAgainNumber = 0): void {
    this.saveRoomId(roomId);
    this.saveTries([]);
    this.saveStartAgainNumber(startAgainNumber);
  }

  clearLocalStorage(): void {
    localStorage.removeItem(this.getScopedKey(this.triesKey));
    localStorage.removeItem(this.getScopedKey(this.startAgainKey));
    localStorage.removeItem(this.getScopedKey(this.roomIdKey));

    // Remove legacy keys from older versions without user scoping.
    localStorage.removeItem(this.triesKey);
    localStorage.removeItem(this.startAgainKey);
    localStorage.removeItem(this.roomIdKey);
  }
}
