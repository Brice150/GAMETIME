import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { NotificationsCardComponent } from './notifications-card.component';

describe('NotificationsCardComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsCardComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationsCardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
