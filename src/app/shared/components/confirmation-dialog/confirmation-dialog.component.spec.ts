import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appTestProviders } from '../../../../testing/test-providers';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  const close = vi.fn();

  async function build(
    data: string | null = 'supprimer cette room',
  ): Promise<ConfirmationDialogComponent> {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => {
    close.mockClear();
    TestBed.resetTestingModule();
  });

  it('reprend l action a confirmer', async () => {
    expect((await build()).action).toBe('supprimer cette room');
  });

  it('retombe sur une action generique sans texte', async () => {
    expect((await build(null)).action).toBe('delete');
  });

  it('rend la reponse du joueur', async () => {
    const component = await build();

    component.confirm();
    expect(close).toHaveBeenCalledWith(true);

    component.cancel();
    expect(close).toHaveBeenCalledWith(false);
  });
});
