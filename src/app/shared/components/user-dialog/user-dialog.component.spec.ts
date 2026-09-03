import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  appTestProviders,
  buildPlayer,
} from '../../../../testing/test-providers';
import { UserDialogComponent } from './user-dialog.component';

describe('UserDialogComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [UserDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: MAT_DIALOG_DATA, useValue: buildPlayer() },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
