import { CommonModule } from "@angular/common";
import { PageComponent } from "./page.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

@NgModule({
    declarations: [PageComponent],
    imports: [
      CommonModule, 
      BrowserAnimationsModule,
      RouterModule
    ],
    exports: [PageComponent]
  })
  export class PageModule { }