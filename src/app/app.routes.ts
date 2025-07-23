import { Routes } from '@angular/router';
import { ConnectComponent } from './connect/connect.component';
import { noUserGuard } from './core/guards/no-user.guard';
import { userGuard } from './core/guards/user.guard';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RoomComponent } from './room/room.component';
import { AdminComponent } from './admin/admin.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'connect', component: ConnectComponent, canActivate: [noUserGuard] },
  { path: '', component: HomeComponent, canActivate: [userGuard] },
  { path: 'profil', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  {
    path: 'room/:id',
    component: RoomComponent,
    canActivate: [userGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
