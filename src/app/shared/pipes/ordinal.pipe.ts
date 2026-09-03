import { Pipe, PipeTransform } from '@angular/core';
import { ordinalSuffix } from '../../core/utils/ordinal.util';

@Pipe({
  name: 'ordinal',
  pure: true,
})
export class OrdinalPipe implements PipeTransform {
  transform(position: number): string {
    return ordinalSuffix(position);
  }
}
