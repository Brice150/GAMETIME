import { Pipe, PipeTransform } from '@angular/core';
import { QuizCategory } from 'src/app/core/enums/quiz-category.enum';

@Pipe({
  name: 'quizCategory',
  pure: true,
})
export class QuizCategoryPipe implements PipeTransform {
  transform(categoryFilter: number): string {
    return QuizCategory[categoryFilter] ?? QuizCategory[1];
  }
}
