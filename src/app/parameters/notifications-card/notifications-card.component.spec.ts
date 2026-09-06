import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  overrideProvider as override,
} from '../../../testing/test-providers';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationsCardComponent } from './notifications-card.component';

describe('NotificationsCardComponent', () => {
  async function build(
    extra: (Provider | EnvironmentProviders)[] = [],
  ): Promise<NotificationsCardComponent> {
    await TestBed.configureTestingModule({
      imports: [NotificationsCardComponent],
      providers: appTestProviders(extra),
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationsCardComponent);
    fixture.detectChanges();
    // `ngOnInit` interroge le service : la promesse est deja resolue.
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('reflete l etat du service a l ouverture', async () => {
    const component = await build([
      override(NotificationService, {
        isEnabled: true,
        isSupported: true,
        isBlocked: false,
        requiresInstall: false,
        isPushConfigured: true,
        isPushAvailable: () => Promise.resolve(true),
      }),
    ]);

    expect(component.enabled()).toBe(true);
    expect(component.pushAvailable()).toBe(true);
    expect(component.isSupported).toBe(true);
    expect(component.isBlocked).toBe(false);
    expect(component.requiresInstall).toBe(false);
    expect(component.isPushConfigured).toBe(true);
  });

  it('rapporte un navigateur qui bloque les notifications', async () => {
    const component = await build([
      override(NotificationService, {
        isSupported: false,
        isBlocked: true,
        requiresInstall: true,
        isPushConfigured: false,
        isPushAvailable: () => Promise.resolve(false),
      }),
    ]);

    expect(component.isSupported).toBe(false);
    expect(component.isBlocked).toBe(true);
    expect(component.requiresInstall).toBe(true);
    expect(component.isPushConfigured).toBe(false);
    expect(component.pushAvailable()).toBe(false);
  });

  describe('bascule', () => {
    it('active et remercie', async () => {
      const component = await build();
      const info = vi.spyOn(component.toastrHelper, 'info');

      await component.toggle(true);

      expect(component.enabled()).toBe(true);
      expect(component.busy()).toBe(false);
      expect(info).toHaveBeenCalledWith(
        'Notifications activées',
        'Notifications',
      );
    });

    it('signale un refus du navigateur', async () => {
      const component = await build([
        override(NotificationService, { enable: () => Promise.resolve(false) }),
      ]);
      const error = vi.spyOn(component.toastrHelper, 'error');

      await component.toggle(true);

      expect(component.enabled()).toBe(false);
      expect(error).toHaveBeenCalledWith(
        'Votre navigateur a refusé les notifications pour ce site',
      );
    });

    it('desactive sans rien annoncer', async () => {
      const component = await build();
      const disable = vi.spyOn(component.notificationService, 'disable');
      const info = vi.spyOn(component.toastrHelper, 'info');
      component.enabled.set(true);

      await component.toggle(false);

      expect(disable).toHaveBeenCalled();
      expect(component.enabled()).toBe(false);
      expect(component.busy()).toBe(false);
      expect(info).not.toHaveBeenCalled();
    });

    it('rend la main meme si l activation echoue', async () => {
      const component = await build([
        override(NotificationService, {
          enable: () => Promise.reject(new Error('refus')),
        }),
      ]);

      await expect(component.toggle(true)).rejects.toThrow('refus');
      expect(component.busy()).toBe(false);
    });
  });
});
