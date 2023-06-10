import { CommonModule } from "@angular/common";
import { DefinitionComponent } from "./definition.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from "@angular/core";

@NgModule({
    declarations: [DefinitionComponent],
    imports: [
      CommonModule, 
      BrowserAnimationsModule
    ],
    exports: [DefinitionComponent]
  })
  export class PageModule { }