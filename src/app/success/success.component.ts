import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { gameMap, games } from 'src/assets/data/games';
import { goals } from 'src/assets/data/goals';
import { PlayerService } from '../core/services/player.service';
import { MedalsNumberPipe } from '../shared/pipes/medals-number.pipe';
import { StrikeThroughDirective } from './strike-through.directive';

@Component({
  selector: 'app-success',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
    StrikeThroughDirective,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [MedalsNumberPipe],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css',
})
export class SuccessComponent implements OnInit, OnDestroy {
  playerService = inject(PlayerService);
  toastr = inject(ToastrService);
  medalsNumberPipe = inject(MedalsNumberPipe);
  destroyed$ = new Subject<void>();
  loading: boolean = true;
  games = games;
  motusGameKey = gameMap['motus'].key;
  drapeauxGameKey = gameMap['drapeaux'].key;
  marquesGameKey = gameMap['marques'].key;
  quizGameKey = gameMap['quiz'].key;
  gameSelected: string = this.drapeauxGameKey;
  isDrapeauSelected = true;
  motusMedalsNumber = 0;
  drapeauxMedalsNumber = 0;
  marquesMedalsNumber = 0;
  quizMedalsNumber = 0;
  goals = goals;

  get currentMedals(): number {
    if (this.gameSelected === this.motusGameKey) return this.motusMedalsNumber;
    if (this.gameSelected === this.drapeauxGameKey)
      return this.drapeauxMedalsNumber;
    if (this.gameSelected === this.marquesGameKey)
      return this.marquesMedalsNumber;
    if (this.gameSelected === this.quizGameKey) return this.quizMedalsNumber;
    return 0;
  }

  ngOnInit(): void {
    this.playerService.playerReady$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: () => {
        this.getMedalsNumber();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (!error.message.includes('Missing or insufficient permissions.')) {
          this.toastr.error(error.message, 'Game Time', {
            positionClass: 'toast-top-center',
            toastClass: 'ngx-toastr custom error',
          });
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  getMedalsNumber(): void {
    this.motusMedalsNumber = this.medalsNumberPipe.transform(
      this.motusGameKey,
      this.playerService.currentPlayerSig()!
    );
    this.drapeauxMedalsNumber = this.medalsNumberPipe.transform(
      this.drapeauxGameKey,
      this.playerService.currentPlayerSig()!
    );
    this.marquesMedalsNumber = this.medalsNumberPipe.transform(
      this.marquesGameKey,
      this.playerService.currentPlayerSig()!
    );
    this.marquesMedalsNumber = this.medalsNumberPipe.transform(
      this.marquesGameKey,
      this.playerService.currentPlayerSig()!
    );
  }

  getProgress(target: number): number {
    const progress = (this.currentMedals / target) * 100;
    return progress > 100 ? 100 : progress;
  }

  changeGame(gameSelected: string): void {
    this.gameSelected = gameSelected;
  }
}
