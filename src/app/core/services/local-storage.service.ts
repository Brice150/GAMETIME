import { Injectable } from '@angular/core';
import { WordTry } from '../interfaces/wordTry';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly triesKey = 'tries';
  private readonly startAgainKey = 'startAgainNumber';
  private readonly roomIdKey = 'roomId';

  saveTries(value: WordTry[]): void {
    localStorage.setItem(this.triesKey, JSON.stringify(value));
  }

  getTries(): WordTry[] | null {
    const item = localStorage.getItem(this.triesKey);
    if (!item) return null;
    try {
      return JSON.parse(item) as WordTry[];
    } catch {
      return null;
    }
  }

  saveStartAgainNumber(value: number): void {
    localStorage.setItem(this.startAgainKey, value.toString());
  }

  getStartAgainNumber(): number | null {
    const item = localStorage.getItem(this.startAgainKey);
    if (!item) return null;
    const parsed = parseInt(item, 10);
    return isNaN(parsed) ? null : parsed;
  }

  saveRoomId(value: string): void {
    localStorage.setItem(this.roomIdKey, value);
  }

  getRoomId(): string | null {
    const item = localStorage.getItem(this.roomIdKey);
    if (!item) return null;
    return item;
  }

  newGame(roomId: string, startAgainNumber: number = 0): void {
    this.saveRoomId(roomId);
    this.saveTries([]);
    this.saveStartAgainNumber(startAgainNumber);
  }

  clearLocalStorage(): void {
    localStorage.removeItem(this.triesKey);
    localStorage.removeItem(this.startAgainKey);
    localStorage.removeItem(this.roomIdKey);
  }
}
