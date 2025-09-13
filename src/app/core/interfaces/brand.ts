import { BrandCategory } from '../enums/brand-category.enum';

export interface Brand {
  name: string;
  website: string;
  category: BrandCategory;
}
