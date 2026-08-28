import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '../../core/interfaces/player';
import { getTotalMedalsNumber } from '../../core/utils/medals.util';

@Pipe({
  name: 'totalMedalsNumber',
  pure: true,
})
export class TotalMedalsNumberPipe implements PipeTransform {
  transform(player: Player): number {
    return getTotalMedalsNumber(player);
  }
}
