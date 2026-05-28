import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { getAI, GoogleAIBackend } from '@angular/fire/ai';
import {
  FirebaseApp,
  initializeApp,
  provideFirebaseApp,
} from '@angular/fire/app';
import { getAuth, GoogleAuthProvider, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
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
import { SmartPreloading } from './core/services/smart-preloading.service';
import { AI_TOKEN } from './core/tokens/ai.token';

const firebaseApp: FirebaseApp = initializeApp(environment.firebase);

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
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
    provideHttpClient(),
    provideFirebaseApp(() => firebaseApp),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    {
      provide: AI_TOKEN,
      useValue: ai,
    },
    {
      provide: GoogleAuthProvider,
      useValue: new GoogleAuthProvider(),
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
