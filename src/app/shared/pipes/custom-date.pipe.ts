import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate',
  pure: true,
})
export class CustomDatePipe implements PipeTransform {
  datePipe = inject(DatePipe);

  transform(startDate: any): string {
    if (!startDate) return '';

    const start = this.datePipe.transform(this.toJsDate(startDate), 'short');
    return start ?? '';
  }

  private toJsDate(date: any): Date {
    return typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
  }
}
