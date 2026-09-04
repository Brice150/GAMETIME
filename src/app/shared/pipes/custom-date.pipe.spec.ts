import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CustomDatePipe } from './custom-date.pipe';

describe('CustomDatePipe', () => {
  let pipe: CustomDatePipe;
  let datePipe: DatePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DatePipe, CustomDatePipe] });
    pipe = TestBed.inject(CustomDatePipe);
    datePipe = TestBed.inject(DatePipe);
  });

  it('retourne une chaine vide sans date', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('formate une date javascript au format court', () => {
    const date = new Date(2026, 0, 2, 15, 4);

    expect(pipe.transform(date)).toBe(datePipe.transform(date, 'short') ?? '');
  });

  it('convertit un Timestamp Firestore via toDate', () => {
    const date = new Date(2026, 0, 2, 15, 4);

    expect(pipe.transform({ toDate: () => date })).toBe(
      datePipe.transform(date, 'short') ?? '',
    );
  });
});
