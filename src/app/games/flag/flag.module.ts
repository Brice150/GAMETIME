import { CommonModule } from "@angular/common";
import { FlagComponent } from "./flag.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from "@angular/core";

@NgModule({
    declarations: [FlagComponent],
    imports: [
      CommonModule, 
      BrowserAnimationsModule
    ],
    exports: [FlagComponent]
  })
  export class PageModule { }