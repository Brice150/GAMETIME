import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appTestProviders, buildPlayer } from '../../../testing/test-providers';
import { UserComponent } from './user.component';

describe('UserComponent', () => {
  async function build(): Promise<UserComponent> {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserComponent);
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('demande l ouverture de la fenetre de profil', async () => {
    const component = await build();
    const updated = vi.fn();
    component.updateEvent.subscribe(updated);

    component.update();

    expect(updated).toHaveBeenCalled();
  });
});
