import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../testing/test-providers';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
