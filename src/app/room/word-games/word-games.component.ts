import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { gameMap } from '../../../assets/data/games';
import { Player } from '../../core/interfaces/player';
import { Room } from '../../core/interfaces/room';
import { RoundResult } from '../../core/interfaces/round-result';
import { ImageService } from '../../core/services/image.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
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
  imageError = false;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  imageService = inject(ImageService);
  localStorageService = inject(LocalStorageService);
  isOver = false;
  loading = false;
  currentIndex = 0;
  preloaders: HTMLImageElement[] = [];
  readonly room = input.required<Room>();
  readonly player = input.required<Player>();
  readonly lastRound = input<RoundResult | null>(null);
  @Output() finishedStepEvent = new EventEmitter<boolean>();
  @Output() progressEvent = new EventEmitter<{
    lettersFound: number;
    lettersTotal: number;
  }>();

  ngOnInit(): void {
    this.new();
  }

  handleEvent(stepWon: boolean): void {
    this.finishedStepEvent.emit(stepWon);
  }

  handleProgress(lettersFound: number): void {
    this.progressEvent.emit({
      lettersFound,
      lettersTotal: this.response?.length ?? 0,
    });
  }

  new(): void {
    const index = this.player().currentRoomWins.length;

    if (index === this.room().responses.length) {
      this.isOver = true;
      return;
    }

    this.currentIndex = index;
    this.imageUrl = this.buildImageUrl(index);
    this.imageError = false;
    this.loading = !!this.imageUrl;
    this.preloadFrom(index + 1);

    this.response = this.room().responses[index || 0];

    if (!this.loading) {
      this.startTimer();
    }
  }

  buildImageUrl(index: number): string {
    const room = this.room();

    if (room.gameName === this.drapeauxGameKey && room.countries?.[index]) {
      return this.imageService.getDrapeauImageUrl(room.countries[index].code);
    }

    if (room.gameName === this.marquesGameKey && room.brands?.[index]) {
      return this.imageService.getLogoMarqueUrl(room.brands[index].website);
    }

    return '';
  }

  // Toutes les images restantes sont mises en cache pendant que le joueur
  // repond. Les references gardees evitent que les telechargements soient
  // abandonnes avant la fin.
  preloadFrom(index: number): void {
    const room = this.room();
    const preloaders: HTMLImageElement[] = [];

    for (let i = index; i < room.responses.length; i++) {
      const url = this.buildImageUrl(i);

      if (url) {
        const image = new Image();
        image.src = url;
        preloaders.push(image);
      }
    }

    this.preloaders = preloaders;
  }

  imageLoaded(): void {
    this.loading = false;
    this.startTimer();
  }

  imageFailed(): void {
    this.loading = false;
    this.imageError = true;
    this.startTimer();
  }

  // Le chrono part quand la question est reellement lisible, pas a l'arrivee
  // du snapshot : le telechargement de la premiere image n'est plus facture au
  // joueur. Sans effet ensuite, le depart n'etant pris qu'une fois par partie.
  startTimer(): void {
    this.localStorageService.startTimer(
      this.room().id!,
      this.room().startAgainNumber,
    );
  }
}
