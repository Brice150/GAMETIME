import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { RoomComponent } from './room.component';

describe('RoomComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [RoomComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(RoomComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
