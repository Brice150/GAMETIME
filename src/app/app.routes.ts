import { Routes } from '@angular/router';
import { FlagComponent } from './games/flag/flag.component';
import { MotusComponent } from './games/motus/motus.component';
import { HomeComponent } from './home/home.component';
import { userGuard } from './core/guards/user.guard';
import { noUserGuard } from './core/guards/no-user.guard';
import { ConnectComponent } from './connect/connect.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: 'connect', component: ConnectComponent, canActivate: [noUserGuard] },
  { path: '', component: HomeComponent, canActivate: [userGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'motus/solo', component: MotusComponent, canActivate: [userGuard] },
  { path: 'motus/multi', component: MotusComponent, canActivate: [userGuard] },
  { path: 'flag/solo', component: FlagComponent, canActivate: [userGuard] },
  { path: 'flag/multi', component: FlagComponent, canActivate: [userGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
