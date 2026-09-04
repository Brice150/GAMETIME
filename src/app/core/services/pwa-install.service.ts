import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { ToastrHelperService } from './toastr-helper.service';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private toastrHelper = inject(ToastrHelperService);
  private localStorageService = inject(LocalStorageService);
  private platformId = inject(PLATFORM_ID);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  init(): void {
    // Rien a proposer au prerendu : il n'y a pas de navigateur a equiper.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.promptInstall();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
    });
  }

  private promptInstall(): void {
    if (
      !this.deferredPrompt ||
      this.localStorageService.getPwaInstallDismissed()
    ) {
      return;
    }

    this.toastrHelper.installPrompt().subscribe((action) => {
      if (action === 'install') {
        void this.deferredPrompt?.prompt();
        this.deferredPrompt = null;
      } else {
        this.localStorageService.setPwaInstallDismissed();
      }
    });
  }
}
