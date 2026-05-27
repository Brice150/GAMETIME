import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '../../core/interfaces/player';

@Pipe({
  name: 'medalsNumber',
  pure: true,
})
export class MedalsNumberPipe implements PipeTransform {
  transform(gameName: string, player: Player): number {
    const stat = player?.stats?.find((stat) => stat.gameName === gameName);

    return stat?.medalsNumber ?? 0;
  }
}
