import { Pipe, PipeTransform } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';

@Pipe({
  name: 'medalsNumber',
  pure: true,
})
export class MedalsNumberPipe implements PipeTransform {
  transform(gameName: string, player: Player): number {
    const stat = player?.stats?.find((stat) => stat.gameName === gameName);

    return stat?.medalsNumer ?? 0;
  }
}
