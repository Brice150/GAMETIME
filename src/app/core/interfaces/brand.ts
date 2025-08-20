import { BrandCategory } from '../enums/brand-category';

export interface Brand {
  name: string;
  website: string;
  category: BrandCategory;
}
