import { Pipe, PipeTransform } from '@angular/core';
import { BrandCategory } from 'src/app/core/enums/brand-category';

@Pipe({
  name: 'category',
  pure: true,
})
export class CategoryPipe implements PipeTransform {
  transform(categoryFilter: number): string {
    return BrandCategory[categoryFilter] ?? '';
  }
}
