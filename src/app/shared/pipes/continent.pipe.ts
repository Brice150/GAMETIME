import { Pipe, PipeTransform } from '@angular/core';
import { Continent } from 'src/app/core/enums/continent.enum';

@Pipe({
  name: 'continent',
  pure: true,
})
export class ContinentPipe implements PipeTransform {
  transform(continentFilter: number): string {
    return Continent[continentFilter] ?? '';
  }
}
