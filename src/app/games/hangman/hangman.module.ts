import { CommonModule } from "@angular/common";
import { HangmanComponent } from "./hangman.component";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";

@NgModule({
    declarations: [HangmanComponent],
    imports: [
      CommonModule,
      SharedModule
    ],
    exports: [HangmanComponent]
  })
  export class HangmanModule { }