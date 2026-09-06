import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalErrorHandler } from './global-error-handler';
import { LoggingService } from './services/logging.service';

describe('GlobalErrorHandler', () => {
  const logError = vi.fn();

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: LoggingService, useValue: { logError } },
      ],
    });
  });

  afterEach(() => {
    logError.mockClear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('journalise l erreur et la laisse visible en console', () => {
    const error = new Error('Boum');

    TestBed.inject(GlobalErrorHandler).handleError(error);

    expect(console.error).toHaveBeenCalledWith(error);
    expect(logError).toHaveBeenCalledWith(error);
  });

  it('ne se retourne pas contre l application quand la journalisation est indisponible', () => {
    const handler = TestBed.inject(GlobalErrorHandler);
    vi.spyOn(TestBed.inject(Injector), 'get').mockImplementation(() => {
      throw new Error('service introuvable');
    });

    expect(() => handler.handleError(new Error('Boum'))).not.toThrow();
    expect(logError).not.toHaveBeenCalled();
  });
});
