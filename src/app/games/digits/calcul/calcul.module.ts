import { CommonModule } from '@angular/common';
import { CalculComponent } from './calcul.component';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CalculComponent],
  imports: [CommonModule, SharedModule, MatSliderModule, FormsModule],
  exports: [CalculComponent],
})
export class CalculModule {}
