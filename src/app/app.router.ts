import { RouterModule, Routes } from '@angular/router';
import { CalculComponent } from './games/digits/calcul/calcul.component';
import { PriceComponent } from './games/digits/price/price.component';
import { FlagComponent } from './games/letters/flag/flag.component';
import { MeliMeloComponent } from './games/letters/melimelo/melimelo.component';
import { MotusComponent } from './games/letters/motus/motus.component';
import { PageComponent } from './page/page.component';

const routes: Routes = [
  { path: '', component: PageComponent },
  { path: 'motus', component: MotusComponent },
  { path: 'drapeau', component: FlagComponent },
  { path: 'melimelo', component: MeliMeloComponent },
  { path: 'price', component: PriceComponent },
  { path: 'calcul', component: CalculComponent },
  { path: '**', component: PageComponent },
];

export const appRouter = RouterModule.forRoot(routes);
