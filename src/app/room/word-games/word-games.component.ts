import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { gameMap } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { ImageService } from '../../core/services/image.service';
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
export class WordGamesComponent implements OnInit {
  response!: string;
  imageUrl = '';
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  imageService = inject(ImageService);
  isOver = false;
  loading = false;
  readonly room = input.required<Room>();
  readonly player = input.required<Player>();
  destroyRef = inject(DestroyRef);
  @Output() finishedStepEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.new();
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
        .pipe(takeUntilDestroyed(this.destroyRef))
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
        .pipe(takeUntilDestroyed(this.destroyRef))
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
