import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  appTestProviders,
  buildPlayer,
} from '../../../../testing/test-providers';
import { UserAdminDialogComponent } from './user-admin-dialog.component';

describe('UserAdminDialogComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [UserAdminDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: MAT_DIALOG_DATA, useValue: buildPlayer() },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserAdminDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
