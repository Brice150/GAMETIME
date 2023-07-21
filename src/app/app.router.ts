import { RouterModule, Routes } from "@angular/router";
import { PageComponent } from "./page/page.component";
import { FlagComponent } from "./games/letters/flag/flag.component";
import { MotusComponent } from "./games/letters/motus/motus.component";

const routes: Routes = [
    {path: '', component: PageComponent},
    {path: 'motus', component: MotusComponent},
    {path: 'drapeau', component: FlagComponent}
];

export const appRouter = RouterModule.forRoot(routes)