import { CommonModule } from '@angular/common';
import { MotusComponent } from './motus.component';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [MotusComponent],
  imports: [CommonModule, SharedModule, MatSliderModule, FormsModule],
  exports: [MotusComponent],
})
export class MotusModule {}
