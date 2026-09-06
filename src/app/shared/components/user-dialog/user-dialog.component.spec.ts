import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
} from '../../../../testing/test-providers';
import { Player } from '../../../core/interfaces/player';
import { UserDialogComponent } from './user-dialog.component';

describe('UserDialogComponent', () => {
  const close = vi.fn();

  async function build(
    data: Player | null = buildPlayer(),
  ): Promise<UserDialogComponent> {
    await TestBed.configureTestingModule({
      imports: [UserDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => {
    close.mockClear();
    TestBed.resetTestingModule();
  });

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('prerenseigne le formulaire avec la fiche du joueur', async () => {
    const component = await build();

    expect(component.userForm.value).toEqual({
      username: 'Test',
      animal: '🐱',
    });
  });

  it('s ouvre vide quand aucune fiche n est passee', async () => {
    const component = await build(null);

    expect(component.player).toBeUndefined();
    expect(component.userForm.value.username).toBeNull();
  });

  it('ferme sans rien changer', async () => {
    const component = await build();

    component.cancel();

    expect(close).toHaveBeenCalledWith(false);
  });

  it('renvoie le profil saisi', async () => {
    const component = await build();

    component.userForm.setValue({ username: 'Alice', animal: '🐶' });
    component.confirm();

    expect(close).toHaveBeenCalledWith({ username: 'Alice', animal: '🐶' });
  });

  it('refuse de fermer sur un pseudo trop court', async () => {
    const component = await build();

    component.userForm.patchValue({ username: 'ab' });
    component.confirm();

    expect(component.userForm.touched).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });
});
