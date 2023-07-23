import { RouterModule, Routes } from "@angular/router";
import { PageComponent } from "./page/page.component";
import { FlagComponent } from "./games/letters/flag/flag.component";
import { MotusComponent } from "./games/letters/motus/motus.component";
import { MeliMeloComponent } from "./games/letters/melimelo/melimelo.component";
import { PriceComponent } from "./games/digits/price/price.component";
import { CalculComponent } from "./games/digits/calcul/calcul.component";

const routes: Routes = [
    {path: '', component: PageComponent},
    {path: 'motus', component: MotusComponent},
    {path: 'drapeau', component: FlagComponent},
    {path: 'melimelo', component: MeliMeloComponent},
    {path: 'price', component: PriceComponent},
    {path: 'calcul', component: CalculComponent}
];

export const appRouter = RouterModule.forRoot(routes)