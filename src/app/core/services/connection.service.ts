import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  saveData: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private static readonly MIN_DOWNLINK_MBPS = 1.5;

  private readonly canPreload = new BehaviorSubject<boolean>(true);
  readonly canPreload$ = this.canPreload.asObservable();

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (!this.isBrowser) return;

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;

    if (!connection) return;

    const update = (): void => {
      this.canPreload.next(
        !connection.saveData &&
          connection.effectiveType === '4g' &&
          connection.downlink >= ConnectionService.MIN_DOWNLINK_MBPS,
      );
    };

    update();
    connection.addEventListener('change', update);
  }

  shouldPreload(): boolean {
    return this.canPreload.value;
  }
}
