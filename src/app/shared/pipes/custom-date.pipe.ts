import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate',
  pure: true,
})
export class CustomDatePipe implements PipeTransform {
  datePipe = inject(DatePipe);

  transform(startDate: unknown): string {
    if (!startDate) return '';

    const start = this.datePipe.transform(this.toJsDate(startDate), 'short');
    return start ?? '';
  }

  private toJsDate(date: unknown): Date {
    if (
      typeof date === 'object' &&
      date !== null &&
      'toDate' in date &&
      typeof date.toDate === 'function'
    ) {
      return date.toDate();
    }

    return new Date(date as string | number | Date);
  }
}
