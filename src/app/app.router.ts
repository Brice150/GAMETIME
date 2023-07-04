import { RouterModule, Routes } from "@angular/router";
import { PageComponent } from "./page/page.component";
import { FlagComponent } from "./games/flag/flag.component";
import { MotusComponent } from "./games/motus/motus.component";
import { MultiComponent } from "./games/multi/multi.component";

const routes: Routes = [
    {path: '', component: PageComponent},
    {path: 'motus', component: MotusComponent},
    {path: 'flag', component: FlagComponent},
    {path: 'multi', component: MultiComponent}
];

export const appRouter = RouterModule.forRoot(routes)