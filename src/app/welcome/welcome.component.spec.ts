import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
