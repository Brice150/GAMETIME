import {
  EnvironmentProviders,
  Provider,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { Player } from '../app/core/interfaces/player';
import { Room } from '../app/core/interfaces/room';
import { FriendService } from '../app/core/services/friend.service';
import { GameApiService } from '../app/core/services/game-api.service';
import { ImageService } from '../app/core/services/image.service';
import { InvitationService } from '../app/core/services/invitation.service';
import { LocalStorageService } from '../app/core/services/local-storage.service';
import { NotificationService } from '../app/core/services/notification.service';
import { PlayerService } from '../app/core/services/player.service';
import { ProfileService } from '../app/core/services/profile.service';
import { PwaInstallService } from '../app/core/services/pwa-install.service';
import { PwaUpdateService } from '../app/core/services/pwa-update.service';
import { RoomService } from '../app/core/services/room.service';
import { ThemeService } from '../app/core/services/theme.service';
import { ToastrHelperService } from '../app/core/services/toastr-helper.service';
import { UserService } from '../app/core/services/user.service';

export function buildPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    userId: 'u1',
    username: 'Test',
    animal: '🐱',
    isAdmin: false,
    stats: [
      { gameName: 'motus', medalsNumber: 3, lastSuccessRetrieved: 0 },
      { gameName: 'drapeaux', medalsNumber: 2, lastSuccessRetrieved: 0 },
      { gameName: 'marques', medalsNumber: 1, lastSuccessRetrieved: 0 },
    ],
    currentRoomWins: [],
    finishDate: null,
    durationMs: null,
    isReady: false,
    friendIds: [],
    friendRequestIds: [],
    ...overrides,
  };
}

export function buildRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'r1',
    gameName: 'motus',
    playerIds: ['u1'],
    userId: 'u1',
    isStarted: false,
    showFirstLetter: false,
    stepsNumber: 3,
    categoryFilter: 1,
    isWordLengthIncreasing: true,
    startWordLength: 5,
    responses: ['CHAT', 'CHIEN', 'CHEVAL'],
    countries: [],
    brands: [],
    startDate: null,
    startAgainNumber: 0,
    roomCode: 'ABCD',
    ...overrides,
  };
}

/**
 * Doublures de tous les services applicatifs : aucun test de composant ne
 * touche Firebase, et un test de creation tient en quelques lignes.
 *
 * `getRoom` ne renvoie rien volontairement : la page room deroule sinon toute
 * sa logique de partie, ce qui n'est pas l'objet d'un test de creation.
 */
export function appTestProviders(
  extra: (Provider | EnvironmentProviders)[] = [],
): (Provider | EnvironmentProviders)[] {
  const player = buildPlayer();
  const noop = () => undefined;

  return [
    provideZonelessChangeDetection(),
    provideNoopAnimations(),
    provideRouter([]),
    { provide: ActivatedRoute, useValue: { params: of({ id: 'r1' }) } },
    {
      provide: PlayerService,
      useValue: {
        currentPlayerSig: signal<Player | null | undefined>(player),
        currentPlayersSig: signal<Player[]>([player]),
        playerReady$: of(player),
        getPlayer: () => of([player]),
        getPlayers: () => of([player]),
        getAllPlayers: () => of([player]),
        addPlayer: () => of('test@example.com'),
        updatePlayer: () => of(undefined),
        updatePlayerFields: () => of(undefined),
        updatePlayers: () => of(undefined),
        deletePlayer: () => of(undefined),
        deleteUserPlayer: () => of(undefined),
      },
    },
    {
      provide: RoomService,
      useValue: {
        currentRoomSig: signal<Room | null | undefined>(undefined),
        getRoom: () => EMPTY,
        getRooms: () => of([]),
        getRoomsByCode: () => of([]),
        getRoomsForPlayers: () => of([]),
        addRoom: () => of('r1'),
        updateRoom: () => of(undefined),
        updateRoomFields: () => of(undefined),
        addPlayerToRoom: () => of(undefined),
        removePlayerFromRoom: () => of(undefined),
        deleteRoom: () => of(undefined),
        deleteUserRooms: () => of(undefined),
        leaveOtherRooms: () => of(undefined),
        isStale: () => false,
        preloadGameData: noop,
        generateRoomCode: () => 'ABCD',
      },
    },
    {
      provide: LocalStorageService,
      useValue: {
        getTries: () => null,
        getStartAgainNumber: () => null,
        getRoomId: () => null,
        getElapsedMs: () => null,
        getPwaInstallDismissed: () => true,
        setPwaInstallDismissed: noop,
        saveTries: noop,
        startTimer: noop,
        newGame: noop,
        clearLocalStorage: noop,
      },
    },
    {
      provide: ToastrHelperService,
      useValue: {
        info: noop,
        error: noop,
        handleError: noop,
        installPrompt: () => EMPTY,
      },
    },
    {
      provide: UserService,
      useValue: {
        auth: { currentUser: null },
        user$: of(null),
        currentUserSig: signal(null),
        redirectUrl: null,
        warmUpSignInPopup: noop,
        signInWithGoogle: () => EMPTY,
        signInWithGithub: () => EMPTY,
        signInAsGuest: () => EMPTY,
        linkAnonymousAccountWithGoogle: () => EMPTY,
        linkAnonymousAccountWithGithub: () => EMPTY,
        logout: () => of(undefined),
      },
    },
    {
      provide: NotificationService,
      useValue: {
        isSupported: true,
        isBlocked: false,
        requiresInstall: false,
        isPushConfigured: true,
        isEnabled: false,
        isPushAvailable: () => Promise.resolve(true),
        enable: () => Promise.resolve(true),
        disable: () => Promise.resolve(),
        initOnStartup: () => Promise.resolve(),
        notify: noop,
      },
    },
    { provide: PwaUpdateService, useValue: { init: noop } },
    { provide: PwaInstallService, useValue: { init: noop } },
    {
      provide: FriendService,
      useValue: {
        normalizeText: (value: string) => value.trim().toLowerCase(),
        isFriend: () => false,
        hasSentRequestTo: () => false,
        hasRequestFrom: () => false,
        sendRequest: () => of(undefined),
        cancelRequest: () => of(undefined),
        acceptRequest: () => of(undefined),
        declineRequest: () => of(undefined),
        removeFriend: () => of(undefined),
      },
    },
    { provide: ProfileService, useValue: { deleteProfile: () => of(undefined) } },
    {
      provide: GameApiService,
      useValue: {
        submitRound: () => EMPTY,
        claimGoal: () => EMPTY,
        manageFriendship: () => of(undefined),
        linkGuestAccount: () => of({ migrated: false }),
      },
    },
    {
      provide: ImageService,
      useValue: {
        getDrapeauImageUrl: () => '',
        getLogoMarqueUrl: () => '',
      },
    },
    {
      provide: InvitationService,
      useValue: {
        getMyInvitations: () => of([]),
        sendInvitation: () => of(undefined),
        deleteInvitation: () => of(undefined),
      },
    },
    {
      provide: ThemeService,
      useValue: { theme: signal('dark'), toggle: noop },
    },
    ...extra,
  ];
}
