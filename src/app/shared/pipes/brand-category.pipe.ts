import { Pipe, PipeTransform } from '@angular/core';
import { BrandCategory } from 'src/app/core/enums/brand-category.enum';

@Pipe({
  name: 'brandCategory',
  pure: true,
})
export class BrandCategoryPipe implements PipeTransform {
  transform(categoryFilter: number): string {
    return BrandCategory[categoryFilter] ?? BrandCategory[1];
  }
}
