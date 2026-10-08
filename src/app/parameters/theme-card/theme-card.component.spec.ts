import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { appTestProviders } from '../../../testing/test-providers';
import { ThemeCardComponent } from './theme-card.component';

describe('ThemeCardComponent', () => {
  async function build() {
    await TestBed.configureTestingModule({
      imports: [ThemeCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeCardComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('propose systeme, clair et sombre', async () => {
    const fixture = await build();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Système');
    expect(text).toContain('Clair');
    expect(text).toContain('Sombre');
  });

  it('applique le mode choisi', async () => {
    const fixture = await build();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.themeService.mode()).toBe('dark');
    expect(buttons[2].getAttribute('aria-checked')).toBe('true');
  });
});
