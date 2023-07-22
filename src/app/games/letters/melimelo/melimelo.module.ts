import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import {MatSliderModule} from '@angular/material/slider';
import { FormsModule } from "@angular/forms";
import { MeliMeloComponent } from "./melimelo.component";

@NgModule({
    declarations: [MeliMeloComponent],
    imports: [
      CommonModule,
      SharedModule,
      MatSliderModule,
      FormsModule
    ],
    exports: [MeliMeloComponent]
  })
  export class MeliMeloModule { }