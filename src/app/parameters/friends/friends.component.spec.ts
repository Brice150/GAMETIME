import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { FriendsComponent } from './friends.component';

describe('FriendsComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [FriendsComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(FriendsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
