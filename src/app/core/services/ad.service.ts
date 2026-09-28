import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { ConsentService } from './consent.service';

const ADSENSE_URL =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

/**
 * Chargement d'AdSense, uniquement apres consentement : sans accord, aucun
 * script publicitaire n'est demande, donc aucun traceur n'est depose.
 */
@Injectable({ providedIn: 'root' })
export class AdService {
  private readonly consent = inject(ConsentService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loaded = false;

  readonly client = environment.ads.client;

  readonly ready = computed(
    () => this.isBrowser && !!this.client && this.consent.adsAllowed(),
  );

  // Un seul script pour toute la page, quel que soit le nombre de blocs.
  load(): void {
    if (this.loaded || !this.ready()) {
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `${ADSENSE_URL}?client=${encodeURIComponent(this.client)}`;
    this.document.head.appendChild(script);
    this.loaded = true;
  }

  // Demande a AdSense de remplir le dernier bloc insere dans la page.
  fill(): void {
    const view = this.document.defaultView as unknown as {
      adsbygoogle?: object[];
    };
    view.adsbygoogle = view.adsbygoogle ?? [];
    view.adsbygoogle.push({});
  }
}
