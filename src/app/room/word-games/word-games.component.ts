import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { RoundAnswer } from '../../core/interfaces/round-answer';
import { RoundResult } from '../../core/interfaces/round-result';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { WordInputComponent } from './word-input/word-input.component';

@Component({
  selector: 'app-word-games',
  imports: [CommonModule, WordInputComponent, MatProgressSpinnerModule],
  templateUrl: './word-games.component.html',
  styleUrl: './word-games.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordGamesComponent implements OnInit {
  readonly response = signal('');
  readonly prompt = signal('');
  readonly imageUrl = signal('');
  readonly imageError = signal(false);
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

  // Libelle du filtre choisi a la creation, quand le jeu en propose un.
  readonly categoryLabel = computed(() => {
    const room = this.room();
    return (
      gameMap[room.gameName]?.filterLabels?.[room.categoryFilter - 1] ?? ''
    );
  });
  @Output() finishedStepEvent = new EventEmitter<RoundAnswer>();
  @Output() progressEvent = new EventEmitter<{
    lettersFound: number;
    lettersTotal: number;
  }>();

  ngOnInit(): void {
    this.new();
  }

  handleEvent(answer: RoundAnswer): void {
    this.finishedStepEvent.emit(answer);
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

    const imageUrl = this.room().media?.[index] ?? '';

    this.isOver.set(false);
    this.currentIndex.set(index);
    this.imageUrl.set(imageUrl);
    this.prompt.set(this.room().prompts?.[index] ?? '');
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

  // Toutes les images restantes sont mises en cache pendant que le joueur
  // repond. Lance avant l'affichage de la manche en cours, ce paquet de
  // telechargements se partageait la bande passante avec l'image attendue :
  // le drapeau mettait plusieurs secondes a apparaitre. Il n'est donc amorce
  // qu'une fois celle-ci arrivee.
  preloadFrom(index: number): void {
    const room = this.room();

    for (let i = index; i < room.responses.length; i++) {
      const url = room.media?.[i] ?? '';

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
