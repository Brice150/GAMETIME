import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { AdminComponent } from './admin.component';

describe('AdminComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
