import { Routes } from '@angular/router';
import { FlagComponent } from './games/flag/flag.component';
import { MotusComponent } from './games/motus/motus.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'motus', component: MotusComponent },
  { path: 'flag', component: FlagComponent },
  { path: '**', component: HomeComponent },
];
