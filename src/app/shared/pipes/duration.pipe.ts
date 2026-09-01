import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  pure: true,
})
export class DurationPipe implements PipeTransform {
  transform(durationMs: unknown): string {
    if (typeof durationMs !== 'number' || durationMs < 0) {
      return '—';
    }

    const secondsTotal = Math.floor(durationMs / 1000);
    const days = Math.floor(secondsTotal / 86400);
    const hours = Math.floor((secondsTotal % 86400) / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;

    const tenth = Math.floor((durationMs % 1000) / 100);

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
}
