import { TestBed } from '@angular/core/testing';
import { appTestProviders, buildPlayer } from '../../testing/test-providers';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('player', buildPlayer());
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
