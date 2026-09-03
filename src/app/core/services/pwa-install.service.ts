import { inject, Injectable } from '@angular/core';
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
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  init(): void {
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
