import { CommonModule } from "@angular/common";
import { PageComponent } from "./page.component";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

@NgModule({
    declarations: [PageComponent],
    imports: [
      RouterModule,
      CommonModule,
      FormsModule
    ],
    exports: [PageComponent]
  })
  export class PageModule { }