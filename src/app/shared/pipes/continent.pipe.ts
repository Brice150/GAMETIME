import { Pipe, PipeTransform } from '@angular/core';
import { Continent } from '../../core/enums/continent.enum';

@Pipe({
  name: 'continent',
  pure: true,
})
export class ContinentPipe implements PipeTransform {
  transform(continentFilter: number): string {
    return Continent[continentFilter] ?? Continent[1];
  }
}
