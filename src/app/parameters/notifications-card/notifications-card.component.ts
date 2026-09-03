import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsCardComponent implements OnInit {
  notificationService = inject(NotificationService);
  toastrHelper = inject(ToastrHelperService);
  readonly enabled = signal(false);
  readonly pushAvailable = signal(false);
  readonly busy = signal(false);

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
    this.enabled.set(this.notificationService.isEnabled);
    this.pushAvailable.set(await this.notificationService.isPushAvailable());
  }

  async toggle(checked: boolean): Promise<void> {
    this.busy.set(true);

    try {
      if (!checked) {
        await this.notificationService.disable();
        this.enabled.set(false);
        return;
      }

      const granted = await this.notificationService.enable();
      this.enabled.set(granted);

      if (granted) {
        this.toastrHelper.info('Notifications activées', 'Notifications');
      } else {
        this.toastrHelper.error(
          'Votre navigateur a refusé les notifications pour ce site',
        );
      }
    } finally {
      this.busy.set(false);
    }
  }
}
