import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
