import { inject, Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

const CHECK_INTERVAL = 30 * 60 * 1000;
const BACKGROUND_THRESHOLD = 30 * 60 * 1000;
const STARTUP_WINDOW = 15 * 1000;

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private ngZone = inject(NgZone);

  private readonly startedAt = Date.now();
  private updatePending = false;
  private applying = false;
  private hiddenSince = 0;

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent => event.type === 'VERSION_READY',
        ),
      )
      .subscribe(() => {
        this.updatePending = true;

        // Reperee dans la foulee de l'ouverture, la version est appliquee
        // aussitot : la page vient de s'afficher, l'utilisateur n'a rien
        // engage, et attendre une navigation le laisserait tourner sur
        // l'ancien code, parfois toute la visite.
        if (Date.now() - this.startedAt < STARTUP_WINDOW && this.canApply()) {
          this.apply();
        }
      });

    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart => event instanceof NavigationStart,
        ),
      )
      .subscribe((event) => {
        if (this.canApply()) {
          this.apply(event.url);
        }
      });

    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('visibilitychange', () =>
        this.onVisibilityChange(),
      );
      setInterval(() => this.check(), CHECK_INTERVAL);
    });

    // Le worker programme deja une verification a chaque navigation, mais
    // seulement une fois inactif : la demander ici raccourcit le delai entre
    // un deploiement et sa prise en compte.
    this.check();
  }

  private onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.hiddenSince = Date.now();
      return;
    }

    const backgroundTime = this.hiddenSince ? Date.now() - this.hiddenSince : 0;
    this.hiddenSince = 0;

    if (backgroundTime > BACKGROUND_THRESHOLD && this.canApply()) {
      this.apply();
      return;
    }

    this.check();
  }

  private canApply(): boolean {
    return (
      this.updatePending &&
      !this.applying &&
      this.dialog.openDialogs.length === 0
    );
  }

  private check(): void {
    if (
      this.updatePending ||
      this.applying ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    this.swUpdate.checkForUpdate().catch(() => undefined);
  }

  private apply(url?: string): void {
    this.applying = true;
    this.swUpdate
      .activateUpdate()
      .then(() =>
        url ? document.location.assign(url) : document.location.reload(),
      )
      .catch(() => {
        this.applying = false;
      });
  }
}
