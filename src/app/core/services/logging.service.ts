import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  Firestore,
  serverTimestamp,
} from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';

// Bruit de fonctionnement, pas des incidents : une permission refusee arrive
// a chaque deconnexion, un chunk manquant a chaque deploiement.
const IGNORED = [
  'Missing or insufficient permissions.',
  'ChunkLoadError',
  'Loading chunk',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
];

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);
  private readonly seen = new Set<string>();
  private readonly maxSeen = 100;

  logError(error: unknown): void {
    if (!environment.production) {
      return;
    }

    const { message, stack } = this.normalize(error);

    if (IGNORED.some((pattern) => message.includes(pattern))) {
      return;
    }

    // Une erreur qui se repete en boucle remplirait la collection a elle
    // seule.
    const fingerprint = `${message}|${stack?.slice(0, 200) ?? ''}`;

    if (this.seen.has(fingerprint)) {
      return;
    }

    if (this.seen.size >= this.maxSeen) {
      this.seen.clear();
    }

    this.seen.add(fingerprint);

    const currentUser = this.userService.auth.currentUser;

    addDoc(collection(this.firestore, 'errors'), {
      message: message.slice(0, 1000),
      stack: stack?.slice(0, 4000) ?? null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      createdAt: serverTimestamp(),
    }).catch(() => undefined);
  }

  private normalize(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return { message: error.message || error.name, stack: error.stack };
    }
    if (typeof error === 'string') {
      return { message: error };
    }
    try {
      return { message: JSON.stringify(error) };
    } catch {
      return { message: String(error) };
    }
  }
}
