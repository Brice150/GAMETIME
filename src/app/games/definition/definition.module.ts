import { SharedModule } from "src/app/shared/shared.module";
import { DefinitionComponent } from "./definition.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

@NgModule({
    declarations: [DefinitionComponent],
    imports: [
      CommonModule,
      SharedModule
    ],
    exports: [DefinitionComponent]
  })
  export class DefinitionModule { }