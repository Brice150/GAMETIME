import { CommonModule } from "@angular/common";
import { PageComponent } from "./page.component";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

@NgModule({
    declarations: [PageComponent],
    imports: [
      RouterModule,
      CommonModule
    ],
    exports: [PageComponent]
  })
  export class PageModule { }