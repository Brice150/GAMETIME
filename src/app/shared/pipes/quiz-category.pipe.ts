import { Pipe, PipeTransform } from '@angular/core';
import { themes } from 'src/assets/data/themes';

@Pipe({
  name: 'quizCategory',
  pure: true,
})
export class QuizCategoryPipe implements PipeTransform {
  transform(categoryFilter: number): string {
    return (
      themes.find((theme) => theme.key === categoryFilter.toString())?.label ??
      themes[0].label
    );
  }
}
