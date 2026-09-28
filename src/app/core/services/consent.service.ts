import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ConsentChoice {
  ads: boolean;
  // Date du choix : c'est la preuve du consentement demandee par la CNIL, et
  // le point de depart de sa duree de validite.
  date: string;
  version: number;
}

type ConsentState = 'granted' | 'denied';

// Changer la version redemande le choix a tout le monde : a faire des qu'une
// nouvelle finalite ou un nouveau partenaire s'ajoute.
export const CONSENT_VERSION = 1;

// La CNIL recommande de ne pas conserver un choix, acceptation comme refus,
// plus de six mois.
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'consent';

/**
 * Recueil du consentement aux traceurs publicitaires.
 *
 * Tant que la publicite est desactivee (`environment.ads.enabled`), rien
 * n'est soumis a consentement : aucun bandeau, aucun signal envoye.
 *
 * Avec la CMP de Google, c'est le message servi par AdSense qui recueille et
 * transmet le choix : ce service ne fait alors que le rouvrir.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Lu a la creation : la configuration ne change pas en cours de session.
  readonly required = environment.ads.enabled;
  readonly usesGoogleCmp = this.required && environment.ads.cmp === 'google';

  readonly choice = signal<ConsentChoice | null>(this.read());
  readonly preferencesOpen = signal(false);

  // Jamais au prerendu : le choix n'est connu que du navigateur, et un
  // bandeau fige dans le HTML s'afficherait a tort avant l'hydratation.
  readonly bannerVisible = computed(
    () =>
      this.isBrowser &&
      this.required &&
      !this.usesGoogleCmp &&
      (this.choice() === null || this.preferencesOpen()),
  );

  // Avec la CMP de Google, le script AdSense doit se charger pour afficher
  // le message : c'est lui qui applique ensuite le choix du joueur.
  readonly adsAllowed = computed(
    () => this.required && (this.usesGoogleCmp || this.choice()?.ads === true),
  );

  constructor() {
    if (this.isBrowser && this.required && !this.usesGoogleCmp) {
      this.initConsentMode();
    }
  }

  acceptAll(): void {
    this.save(true);
  }

  rejectAll(): void {
    this.save(false);
  }

  save(ads: boolean): void {
    const withdrawn = this.choice()?.ads === true && !ads;
    const choice: ConsentChoice = {
      ads,
      date: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      // Stockage indisponible (navigation privee stricte) : le choix vaut
      // pour la session, il sera redemande a la prochaine visite.
    }

    this.choice.set(choice);
    this.preferencesOpen.set(false);
    this.updateConsentMode(ads);

    // Un script publicitaire deja charge ne se decharge pas : seul un
    // rechargement garantit que plus rien n'est lu ni depose.
    if (withdrawn) {
      this.reload();
    }
  }

  openPreferences(): void {
    if (this.usesGoogleCmp) {
      this.showGoogleRevocationMessage();
      return;
    }

    this.preferencesOpen.set(true);
  }

  // File d'attente documentee par Google : fonctionne meme si le script du
  // message n'a pas encore fini de charger.
  private showGoogleRevocationMessage(): void {
    const view = this.document.defaultView as unknown as {
      googlefc?: {
        callbackQueue?: unknown[];
        showRevocationMessage?: () => void;
      };
    };
    view.googlefc = view.googlefc ?? {};
    view.googlefc.callbackQueue = view.googlefc.callbackQueue ?? [];
    view.googlefc.callbackQueue.push(() =>
      view.googlefc?.showRevocationMessage?.(),
    );
  }

  closePreferences(): void {
    this.preferencesOpen.set(false);
  }

  reload(): void {
    this.document.location.reload();
  }

  private read(): ConsentChoice | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const choice = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? 'null',
      ) as ConsentChoice | null;

      if (
        !choice ||
        typeof choice.ads !== 'boolean' ||
        choice.version !== CONSENT_VERSION
      ) {
        return null;
      }

      const age = Date.now() - new Date(choice.date).getTime();

      return age >= 0 && age < CONSENT_MAX_AGE_MS ? choice : null;
    } catch {
      return null;
    }
  }

  // Google Consent Mode v2 : tout est refuse par defaut, avant le moindre
  // script Google, puis mis a jour selon le choix enregistre.
  private initConsentMode(): void {
    this.gtag('consent', 'default', {
      ...this.consentSignals('denied'),
      wait_for_update: 500,
    });

    const choice = this.choice();

    if (choice) {
      this.updateConsentMode(choice.ads);
    }
  }

  private updateConsentMode(ads: boolean): void {
    if (!this.isBrowser || !this.required || this.usesGoogleCmp) {
      return;
    }

    this.gtag(
      'consent',
      'update',
      this.consentSignals(ads ? 'granted' : 'denied'),
    );
  }

  private consentSignals(state: ConsentState): Record<string, ConsentState> {
    return {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      // Aucune mesure d'audience n'est faite : ce signal reste refuse.
      analytics_storage: 'denied',
    };
  }

  // Les scripts Google lisent `dataLayer` en attendant l'objet `arguments`
  // lui-meme, pas un tableau : c'est la forme exacte de leur extrait `gtag`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private gtag(..._args: unknown[]): void {
    const view = this.document.defaultView as unknown as {
      dataLayer?: unknown[];
    };
    view.dataLayer = view.dataLayer ?? [];
    // eslint-disable-next-line prefer-rest-params
    view.dataLayer.push(arguments);
  }
}
