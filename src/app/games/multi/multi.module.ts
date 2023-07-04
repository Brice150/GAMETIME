import { CommonModule } from "@angular/common";
import { MultiComponent } from "./multi.component";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";

@NgModule({
    declarations: [MultiComponent],
    imports: [
      CommonModule,
      SharedModule
    ],
    exports: [MultiComponent]
  })
  export class MultiModule { }