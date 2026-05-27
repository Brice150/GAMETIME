import { Pipe, PipeTransform } from '@angular/core';
import { Difficulty } from '../../core/enums/difficulty.enum';

@Pipe({
  name: 'difficulty',
  pure: true,
})
export class DifficultyPipe implements PipeTransform {
  transform(difficultyFilter: number): string {
    return Difficulty[difficultyFilter] ?? Difficulty[2];
  }
}
