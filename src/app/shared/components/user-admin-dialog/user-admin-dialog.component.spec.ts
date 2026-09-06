import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appTestProviders,
  buildPlayer,
} from '../../../../testing/test-providers';
import { Player } from '../../../core/interfaces/player';
import { UserAdminDialogComponent } from './user-admin-dialog.component';

describe('UserAdminDialogComponent', () => {
  const close = vi.fn();

  async function build(
    data: Player | null = buildPlayer(),
  ): Promise<UserAdminDialogComponent> {
    await TestBed.configureTestingModule({
      imports: [UserAdminDialogComponent],
      providers: appTestProviders([
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ]),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserAdminDialogComponent);
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
      motusMedalsNumber: 3,
      drapeauxMedalsNumber: 2,
      marquesMedalsNumber: 1,
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

  it('renvoie la fiche modifiee', async () => {
    const player = buildPlayer();
    const component = await build(player);

    component.userForm.setValue({
      username: 'Alice',
      animal: '🐶',
      motusMedalsNumber: 20,
      drapeauxMedalsNumber: 30,
      marquesMedalsNumber: 40,
    });
    component.confirm();

    expect(player.username).toBe('Alice');
    expect(player.animal).toBe('🐶');
    expect(
      player.stats.map((stat) => [stat.gameName, stat.medalsNumber]),
    ).toEqual([
      ['motus', 20],
      ['drapeaux', 30],
      ['marques', 40],
    ]);
    expect(close).toHaveBeenCalledWith(player);
  });

  it('cree la statistique d un jeu jamais joue', async () => {
    const player = buildPlayer({ stats: [] });
    const component = await build(player);

    component.userForm.setValue({
      username: 'Alice',
      animal: '🐶',
      motusMedalsNumber: 1,
      drapeauxMedalsNumber: 2,
      marquesMedalsNumber: 3,
    });
    component.confirm();

    expect(player.stats).toEqual([
      { gameName: 'drapeaux', medalsNumber: 2, lastSuccessRetrieved: 0 },
      { gameName: 'motus', medalsNumber: 1, lastSuccessRetrieved: 0 },
      { gameName: 'marques', medalsNumber: 3, lastSuccessRetrieved: 0 },
    ]);
  });

  it('refuse de fermer sur un formulaire invalide', async () => {
    const component = await build();

    component.userForm.patchValue({ username: 'ab' });
    component.confirm();

    expect(component.userForm.touched).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });
});
