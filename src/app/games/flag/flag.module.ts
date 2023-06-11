import { SharedModule } from "src/app/shared/shared.module";
import { FlagComponent } from "./flag.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

@NgModule({
    declarations: [FlagComponent],
    imports: [
      CommonModule,
      SharedModule
    ],
    exports: [FlagComponent]
  })
  export class FlagModule { }