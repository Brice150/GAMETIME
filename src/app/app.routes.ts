import { Routes } from '@angular/router';
import { AdminRoomComponent } from './admin-room/admin-room.component';
import { AdminComponent } from './admin/admin.component';
import { ConnectComponent } from './connect/connect.component';
import { adminGuard } from './core/guards/admin.guard';
import { noUserGuard } from './core/guards/no-user.guard';
import { userGuard } from './core/guards/user.guard';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RoomComponent } from './room/room.component';

export const routes: Routes = [
  { path: 'connect', component: ConnectComponent, canActivate: [noUserGuard] },
  { path: '', component: HomeComponent, canActivate: [userGuard] },
  { path: 'profil', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  {
    path: 'admin/:id',
    component: AdminRoomComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'room/:id',
    component: RoomComponent,
    canActivate: [userGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
