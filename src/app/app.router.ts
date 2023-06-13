import { RouterModule, Routes } from "@angular/router";
import { PageComponent } from "./page/page.component";
import { FlagComponent } from "./games/flag/flag.component";
import { DefinitionComponent } from "./games/definition/definition.component";
import { MotusComponent } from "./games/motus/motus.component";

const routes: Routes = [
    {path: '', component: PageComponent},
    {path: 'motus', component: MotusComponent},
    {path: 'flag', component: FlagComponent},
    {path: 'definition', component: DefinitionComponent}
];

export const appRouter = RouterModule.forRoot(routes)