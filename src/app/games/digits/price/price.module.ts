import { CommonModule } from '@angular/common';
import { PriceComponent } from './price.component';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [PriceComponent],
  imports: [CommonModule, SharedModule, MatSliderModule, FormsModule],
  exports: [PriceComponent],
})
export class PriceModule {}
