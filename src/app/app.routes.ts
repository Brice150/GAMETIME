import { Routes } from '@angular/router';
import { ConnectComponent } from './connect/connect.component';
import { noUserGuard } from './core/guards/no-user.guard';
import { userGuard } from './core/guards/user.guard';
import { MotusComponent } from './games/motus/motus.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { DrapeauxComponent } from './games/drapeaux/drapeaux.component';

export const routes: Routes = [
  { path: 'connect', component: ConnectComponent, canActivate: [noUserGuard] },
  { path: '', component: HomeComponent, canActivate: [userGuard] },
  { path: 'profil', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'motus', component: MotusComponent, canActivate: [userGuard] },
  { path: 'drapeaux', component: DrapeauxComponent, canActivate: [userGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
