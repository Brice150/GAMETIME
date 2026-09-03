import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { ParametersComponent } from './parameters.component';

describe('ParametersComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [ParametersComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(ParametersComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
