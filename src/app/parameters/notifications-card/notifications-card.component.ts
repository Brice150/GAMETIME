import { Component, inject, OnInit } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '../../core/services/notification.service';
import { ToastrHelperService } from '../../core/services/toastr-helper.service';

// L'etat exact compte : « activer » ne suffit pas a recevoir un push si le
// navigateur bloque, si iOS n'a pas l'application installee ou si la cle VAPID
// n'est pas configuree. Chaque cas a son message.
@Component({
  selector: 'app-notifications-card',
  imports: [MatSlideToggleModule],
  templateUrl: './notifications-card.component.html',
  styleUrl: './notifications-card.component.css',
})
export class NotificationsCardComponent implements OnInit {
  notificationService = inject(NotificationService);
  toastrHelper = inject(ToastrHelperService);
  enabled = false;
  pushAvailable = false;
  busy = false;

  get isSupported(): boolean {
    return this.notificationService.isSupported;
  }

  get isBlocked(): boolean {
    return this.notificationService.isBlocked;
  }

  get requiresInstall(): boolean {
    return this.notificationService.requiresInstall;
  }

  get isPushConfigured(): boolean {
    return this.notificationService.isPushConfigured;
  }

  async ngOnInit(): Promise<void> {
    this.enabled = this.notificationService.isEnabled;
    this.pushAvailable = await this.notificationService.isPushAvailable();
  }

  async toggle(checked: boolean): Promise<void> {
    this.busy = true;

    try {
      if (!checked) {
        await this.notificationService.disable();
        this.enabled = false;
        return;
      }

      const granted = await this.notificationService.enable();
      this.enabled = granted;

      if (granted) {
        this.toastrHelper.info('Notifications activées', 'Notifications');
      } else {
        this.toastrHelper.error(
          'Votre navigateur a refusé les notifications pour ce site',
        );
      }
    } finally {
      this.busy = false;
    }
  }
}
