import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { SuccessComponent } from './success.component';

describe('SuccessComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(SuccessComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
