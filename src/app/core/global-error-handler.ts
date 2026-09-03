import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { LoggingService } from './services/logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    console.error(error);

    try {
      this.injector.get(LoggingService).logError(error);
    } catch {
      return;
    }
  }
}
