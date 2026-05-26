import { inject, Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root',
})
export class SmartPreloading implements PreloadingStrategy {
  private readonly connection = inject(ConnectionService);

  private static readonly DELAY_MS = 1500;

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false) return EMPTY;

    return timer(SmartPreloading.DELAY_MS).pipe(
      switchMap(() => (this.connection.shouldPreload() ? load() : EMPTY)),
    );
  }
}
