import { CommonModule } from "@angular/common";
import { HangmanComponent } from "./hangman.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from "@angular/core";

@NgModule({
    declarations: [HangmanComponent],
    imports: [
      CommonModule, 
      BrowserAnimationsModule
    ],
    exports: [HangmanComponent]
  })
  export class PageModule { }