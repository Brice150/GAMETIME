import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appTestProviders } from '../../../../testing/test-providers';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  async function build(): Promise<ThemeToggleComponent> {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('se cree', async () => {
    expect(await build()).toBeTruthy();
  });

  it('bascule le theme', async () => {
    const component = await build();
    const toggle = vi.spyOn(component.themeService, 'toggle');

    component.toggle();

    expect(toggle).toHaveBeenCalled();
  });
});
