import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { ImageService } from 'src/app/core/services/image.service';
import { gameMap } from 'src/assets/data/games';
import { BrandCategoryPipe } from '../../shared/pipes/brand-category.pipe';
import { ContinentPipe } from '../../shared/pipes/continent.pipe';
import { WordInputComponent } from './word-input/word-input.component';

@Component({
  selector: 'app-word-games',
  imports: [
    CommonModule,
    WordInputComponent,
    MatProgressSpinnerModule,
    ContinentPipe,
    BrandCategoryPipe,
  ],
  templateUrl: './word-games.component.html',
  styleUrl: './word-games.component.css',
})
export class WordGamesComponent implements OnInit, OnDestroy {
  response!: string;
  imageUrl: string = '';
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  imageService = inject(ImageService);
  isOver = false;
  loading = false;
  readonly room = input.required<Room>();
  readonly player = input.required<Player>();
  destroyed$ = new Subject<void>();
  @Output() finishedStepEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.new();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleEvent(stepWon: boolean): void {
    this.finishedStepEvent.emit(stepWon);
  }

  new(): void {
    const index = this.player().currentRoomWins.length;

    if (index === this.room().responses.length) {
      this.isOver = true;
      return;
    }

    if (
      this.room().gameName === this.drapeauxGameKey &&
      this.room().countries?.length > 0
    ) {
      this.loading = true;
      this.imageService
        .getDrapeauImage(this.room().countries[index || 0].code)
        .pipe(takeUntil(this.destroyed$))
        .subscribe({
          next: (blob) => {
            this.imageUrl = URL.createObjectURL(blob);
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
    } else if (this.room().gameName === this.marquesGameKey) {
      this.loading = true;
      this.imageService
        .getLogoMarque(this.room().brands[index || 0].website)
        .pipe(takeUntil(this.destroyed$))
        .subscribe({
          next: (blob) => {
            this.imageUrl = URL.createObjectURL(blob);
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
    }

    this.response = this.room().responses[index || 0];
  }
}
