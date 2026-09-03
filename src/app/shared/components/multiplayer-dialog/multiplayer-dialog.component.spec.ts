import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  appTestProviders,
  buildRoom,
} from '../../../../testing/test-providers';
import { MultiplayerDialogComponent } from './multiplayer-dialog.component';

describe('MultiplayerDialogComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [MultiplayerDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: MAT_DIALOG_DATA, useValue: buildRoom() },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(MultiplayerDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
