import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timestamp } from '@angular/fire/firestore';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Invitation } from '../../../core/interfaces/invitation';
import { InvitationService } from '../../../core/services/invitation.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastrHelperService } from '../../../core/services/toastr-helper.service';

// Notification d'invitation en temps reel, sans Cloud Function : l'ecoute
// Firestore suffit tant que l'application est ouverte. Une vraie notification
// push (onglet ferme) demanderait un serveur d'envoi FCM.
@Component({
  selector: 'app-invitations',
  imports: [CommonModule],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsComponent implements OnInit {
  invitationService = inject(InvitationService);
  localStorageService = inject(LocalStorageService);
  notificationService = inject(NotificationService);
  toastrHelper = inject(ToastrHelperService);
  router = inject(Router);
  destroyRef = inject(DestroyRef);
  readonly invitations = signal<Invitation[]>([]);
  private readonly currentUrl = signal(this.router.url);
  private readonly notifiedIds = new Set<string>();
  // Une invitation oubliee ne doit pas ressurgir des jours plus tard.
  private readonly maxAgeMs = 6 * 60 * 60 * 1000;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.currentUrl.set(this.router.url));

    this.invitationService
      .getMyInvitations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invitations) => this.handleInvitations(invitations),
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error);
        },
      });
  }

  private handleInvitations(invitations: Invitation[]): void {
    const now = Date.now();

    const visible = invitations
      .filter((invitation) => {
        const createdAt = this.toDate(invitation.createdAt);
        return !createdAt || now - createdAt.getTime() < this.maxAgeMs;
      })
      // Inutile d'annoncer une room deja ouverte.
      .filter(
        (invitation) =>
          !this.currentUrl().startsWith(`/room/${invitation.roomId}`),
      )
      .sort(
        (a, b) =>
          (this.toDate(b.createdAt)?.getTime() ?? 0) -
          (this.toDate(a.createdAt)?.getTime() ?? 0),
      );

    visible.forEach((invitation) => {
      if (invitation.id && !this.notifiedIds.has(invitation.id)) {
        this.notifiedIds.add(invitation.id);
        this.toastrHelper.info(
          `${invitation.fromUsername} vous invite dans une room`,
          'Invitation',
        );
        this.notificationService.notify(
          'Game Time',
          `${invitation.fromUsername} vous invite dans la room ${invitation.roomCode}`,
          invitation.id,
        );
      }
    });

    this.invitations.set(visible);
  }

  join(invitation: Invitation): void {
    this.dismiss(invitation);
    this.localStorageService.newGame(invitation.roomId);
    this.router.navigate([`/room/${invitation.roomId}`]);
  }

  dismiss(invitation: Invitation): void {
    if (!invitation.id) {
      return;
    }

    this.invitations.update((invitations) =>
      invitations.filter((item) => item.id !== invitation.id),
    );

    this.invitationService
      .deleteInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: HttpErrorResponse) => {
          this.toastrHelper.handleError(error);
        },
      });
  }

  // Firestore renvoie un Timestamp, l'ecriture locale une Date.
  private toDate(value: Date | Timestamp | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return value instanceof Date ? value : null;
  }
}
