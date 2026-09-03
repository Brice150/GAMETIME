import { TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { RankingComponent } from './ranking.component';

describe('RankingComponent', () => {
  it('se cree', async () => {
    await TestBed.configureTestingModule({
      imports: [RankingComponent],
      providers: appTestProviders(),
    }).compileComponents();

    const fixture = TestBed.createComponent(RankingComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
