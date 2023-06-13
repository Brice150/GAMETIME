import { CommonModule } from "@angular/common";
import { MotusComponent } from "./motus.component";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";

@NgModule({
    declarations: [MotusComponent],
    imports: [
      CommonModule,
      SharedModule
    ],
    exports: [MotusComponent]
  })
  export class MotusModule { }