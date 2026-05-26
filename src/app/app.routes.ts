import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { noUserGuard } from './core/guards/no-user.guard';
import { userGuard } from './core/guards/user.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./welcome/welcome.component').then((m) => m.WelcomeComponent),
    canActivate: [noUserGuard],
  },
  {
    path: 'accueil',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    canActivate: [userGuard],
  },
  {
    path: 'profil',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [userGuard],
  },
  {
    path: 'succes',
    loadComponent: () =>
      import('./success/success.component').then((m) => m.SuccessComponent),
    canActivate: [userGuard],
  },
  {
    path: 'classement',
    loadComponent: () =>
      import('./ranking/ranking.component').then((m) => m.RankingComponent),
    canActivate: [userGuard],
  },
  {
    path: 'room/:id',
    loadComponent: () =>
      import('./room/room.component').then((m) => m.RoomComponent),
    canActivate: [userGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/:id',
    loadComponent: () =>
      import('./admin-room/admin-room.component').then(
        (m) => m.AdminRoomComponent,
      ),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: 'accueil', pathMatch: 'full' },
];
