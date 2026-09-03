import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../../testing/test-providers';
import { InvitationsComponent } from './invitations.component';

describe('InvitationsComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [InvitationsComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(InvitationsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
