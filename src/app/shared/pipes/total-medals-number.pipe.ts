import { Pipe, PipeTransform } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';

@Pipe({
  name: 'totalMedalsNumber',
  pure: true,
})
export class TotalMedalsNumberPipe implements PipeTransform {
  transform(player: Player): number {
    if (!player?.stats) {
      return 0;
    }

    return player.stats.reduce(
      (sum, stat) => sum + (stat.medalsNumber ?? 0),
      0
    );
  }
}
