import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationBetweenDates',
  pure: true,
})
export class DurationBetweenDatesPipe implements PipeTransform {
  transform(startDate: unknown, finishDate: unknown): string {
    if (!startDate || !finishDate) {
      return '';
    }

    const start = this.toJsDate(startDate);
    const finish = this.toJsDate(finishDate);

    const diffMs = finish.getTime() - start.getTime();

    if (diffMs < 0) {
      return '';
    }

    const secondsTotal = Math.floor(diffMs / 1000);
    const days = Math.floor(secondsTotal / 86400);
    const hours = Math.floor((secondsTotal % 86400) / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;

    const tenth = Math.floor((diffMs % 1000) / 100);

    if (days > 0) {
      return `${days}j ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}.${tenth}s`;
    }
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
