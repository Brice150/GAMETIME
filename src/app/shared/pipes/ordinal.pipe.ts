import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ordinal',
  pure: true,
})
export class OrdinalPipe implements PipeTransform {
  transform(position: number): string {
    if (position === 1) return 'er';
    return 'ème';
  }
}
