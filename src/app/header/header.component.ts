import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { gameMap } from '../../assets/data/games';
import { NavLink } from '../core/interfaces/nav-link';
import { Player } from '../core/interfaces/player';
import { LocalStorageService } from '../core/services/local-storage.service';
import { RoomService } from '../core/services/room.service';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    ThemeToggleComponent,
    MedalsNumberPipe,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  router = inject(Router);
  roomService = inject(RoomService);
  localStorageService = inject(LocalStorageService);
  destroyRef = inject(DestroyRef);
  player = input.required<Player>();
  @Output() logoutEvent = new EventEmitter<void>();

  // Ni l'URL ni localStorage ne sont reactifs : relus a chaque navigation.
  private readonly currentUrl = signal(this.router.url);
  private readonly storedRoomId = signal(this.localStorageService.getRoomId());

  readonly room = computed(() => this.roomService.currentRoomSig());

  readonly isRoomPage = computed(
    () => !!this.room() && this.currentUrl().startsWith('/room'),
  );

  // Les titres sont ecrits en dur : l'URL est sans accent.
  private readonly titlesByPath: Record<string, string> = {
    '/accueil': 'Accueil',
    '/parametres': 'Paramètres',
    '/classement': 'Classement',
  };

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();

    if (this.isRoomPage()) {
      const room = this.room()!;
      return gameMap[room.gameName]?.label ?? room.roomCode;
    }
    if (url.startsWith('/admin')) {
      return 'Admin';
    }
    if (url === '/' || url.startsWith('/room')) {
      return 'Game Time';
    }
    return this.titlesByPath[url] ?? url.replace('/', '');
  });

  readonly pendingRequestsNumber = computed(
    () => this.player().friendRequestIds?.length ?? 0,
  );

  readonly navLinks = computed<NavLink[]>(() => {
    const pendingRequests = this.pendingRequestsNumber();

    const links: NavLink[] = [
      { path: '/accueil', label: 'Accueil', icon: 'bxs-home', exact: true },
      {
        path: '/classement',
        label: 'Classement',
        icon: 'bxs-trophy',
        exact: true,
      },
    ];

    const roomId = this.storedRoomId();
    if (roomId) {
      links.push({
        path: `/room/${roomId}`,
        label: 'Room',
        icon: 'bx-play',
        exact: true,
      });
    }

    if (this.player().isAdmin) {
      links.push({
        path: '/admin',
        label: 'Admin',
        icon: 'bxs-shield',
        exact: false,
      });
    }

    // Ajoute en dernier : « Paramètres » se retrouve juste avant
    // « Déconnexion », les deux entrees de compte restant cote a cote.
    links.push({
      path: '/parametres',
      label: 'Paramètres',
      icon: 'bxs-cog',
      exact: true,
      badge: pendingRequests,
    });

    return links;
  });

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.storedRoomId.set(this.localStorageService.getRoomId());
      });
  }

  logout(): void {
    this.logoutEvent.emit();
  }
}
