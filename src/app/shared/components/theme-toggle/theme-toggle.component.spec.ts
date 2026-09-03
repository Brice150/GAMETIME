import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../../testing/test-providers';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
