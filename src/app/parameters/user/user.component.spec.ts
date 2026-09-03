import { TestBed } from '@angular/core/testing';
import { appTestProviders, buildPlayer } from '../../../testing/test-providers';
import { UserComponent } from './user.component';

describe('UserComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(UserComponent);
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
