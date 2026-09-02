import { inject, Injectable } from '@angular/core';
import { RoundTimer } from '../interfaces/round-timer';
import { WordTry } from '../interfaces/word-try';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  userService = inject(UserService);
  private readonly triesKey = 'tries';
  private readonly startAgainKey = 'startAgainNumber';
  private readonly roomIdKey = 'roomId';
  private readonly timerKey = 'roundTimer';

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

  // Depart et arrivee sont lus sur la meme horloge, celle de cet appareil :
  // le decalage d'horloge entre joueurs ne peut plus fausser un temps.
  startTimer(roomId: string, startAgainNumber: number): void {
    const timer = this.getTimer();

    if (
      timer &&
      timer.roomId === roomId &&
      timer.startAgainNumber === startAgainNumber
    ) {
      return;
    }

    localStorage.setItem(
      this.getScopedKey(this.timerKey),
      JSON.stringify({ roomId, startAgainNumber, startedAt: Date.now() }),
    );
  }

  getElapsedMs(roomId: string, startAgainNumber: number): number | null {
    const timer = this.getTimer();

    if (
      !timer ||
      timer.roomId !== roomId ||
      timer.startAgainNumber !== startAgainNumber
    ) {
      return null;
    }

    return Math.max(0, Date.now() - timer.startedAt);
  }

  private getTimer(): RoundTimer | null {
    const item = localStorage.getItem(this.getScopedKey(this.timerKey));
    if (!item) return null;
    try {
      return JSON.parse(item) as RoundTimer;
    } catch {
      return null;
    }
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
    localStorage.removeItem(this.getScopedKey(this.timerKey));
  }
}
