import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { appTestProviders } from '../../../../testing/test-providers';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: MAT_DIALOG_DATA, useValue: 'supprimer' },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
