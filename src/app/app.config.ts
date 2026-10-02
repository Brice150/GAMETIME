import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  LOCALE_ID,
  PLATFORM_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';
import { getAuth, GoogleAuthProvider, provideAuth } from '@angular/fire/auth';
import { initializeFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/global-error-handler';
import { SmartPreloading } from './core/services/smart-preloading.service';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      withPreloading(SmartPreloading),
    ),
    provideToastr(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // reCAPTCHA n'existe que dans le navigateur : au prerendu, App Check n'est
    // pas fourni. En developpement, un jeton de debug est affiche dans la
    // console, a enregistrer dans Firebase > App Check > Gerer les jetons.
    ...(typeof window !== 'undefined'
      ? [
          provideAppCheck(() => {
            if (isDevMode()) {
              (
                self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }
              ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            }
            return initializeAppCheck(getApp(), {
              provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          }),
        ]
      : []),
    provideAuth(() => getAuth()),
    // Le cache persistant s'appuie sur IndexedDB : au prerendu, en Node, il
    // n'existe pas. La page d'accueil n'interroge de toute facon aucune
    // collection.
    provideFirestore(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return initializeFirestore(getApp(), {
          ignoreUndefinedProperties: true,
        });
      }

      return initializeFirestore(getApp(), {
        ignoreUndefinedProperties: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }),
    provideFunctions(() => getFunctions(getApp(), environment.functionsRegion)),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    {
      provide: GoogleAuthProvider,
      useValue: new GoogleAuthProvider(),
    },
    // Le test de plateforme se fait sans `inject` : cette valeur est calculee
    // au chargement du module, hors de tout contexte d'injection.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && typeof navigator !== 'undefined',
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
