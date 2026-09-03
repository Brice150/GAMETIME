import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { JoinRoomComponent } from './join-room.component';

describe('JoinRoomComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [JoinRoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(JoinRoomComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
