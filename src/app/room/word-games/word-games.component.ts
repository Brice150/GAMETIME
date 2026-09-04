import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordGamesComponent implements OnInit {
  readonly response = signal('');
  readonly imageUrl = signal('');
  readonly imageError = signal(false);
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  imageService = inject(ImageService);
  localStorageService = inject(LocalStorageService);
  readonly isOver = signal(false);
  readonly loading = signal(false);
  readonly currentIndex = signal(0);
  // Les references sont gardees pour que les telechargements ne soient pas
  // abandonnes avant la fin. Indexees par URL : une manche ne relance pas les
  // requetes deja parties.
  preloaders = new Map<string, HTMLImageElement>();
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
      lettersTotal: this.response().length,
    });
  }

  new(): void {
    const index = this.player().currentRoomWins.length;

    if (index === this.room().responses.length) {
      this.isOver.set(true);
      return;
    }

    const imageUrl = this.buildImageUrl(index);

    this.isOver.set(false);
    this.currentIndex.set(index);
    this.imageUrl.set(imageUrl);
    this.imageError.set(false);
    this.loading.set(!!imageUrl);

    this.response.set(this.room().responses[index || 0]);

    if (!imageUrl) {
      // Pas d'image a afficher : rien ne retarde la mise en cache des
      // suivantes.
      this.preloadFrom(index + 1);
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
  // repond. Lance avant l'affichage de la manche en cours, ce paquet de
  // telechargements se partageait la bande passante avec l'image attendue :
  // le drapeau mettait plusieurs secondes a apparaitre. Il n'est donc amorce
  // qu'une fois celle-ci arrivee.
  preloadFrom(index: number): void {
    const room = this.room();

    for (let i = index; i < room.responses.length; i++) {
      const url = this.buildImageUrl(i);

      if (url && !this.preloaders.has(url)) {
        const image = new Image();
        image.src = url;
        this.preloaders.set(url, image);
      }
    }
  }

  imageLoaded(): void {
    this.loading.set(false);
    this.startTimer();
    this.preloadFrom(this.currentIndex() + 1);
  }

  imageFailed(): void {
    this.loading.set(false);
    this.imageError.set(true);
    this.startTimer();
    this.preloadFrom(this.currentIndex() + 1);
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
