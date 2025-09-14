import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { Player } from 'src/app/core/interfaces/player';
import { Room } from 'src/app/core/interfaces/room';
import { DifficultyPipe } from 'src/app/shared/pipes/difficulty.pipe';
import { QuizCategoryPipe } from '../../shared/pipes/quiz-category.pipe';
import { SelectInputComponent } from './select-input/select-input.component';

@Component({
  selector: 'app-ai-games',
  imports: [
    CommonModule,
    DifficultyPipe,
    SelectInputComponent,
    QuizCategoryPipe,
  ],
  templateUrl: './ai-games.component.html',
  styleUrl: './ai-games.component.css',
})
export class AiGamesComponent implements OnInit {
  index: number = 0;
  isOver = false;
  readonly room = input.required<Room>();
  readonly player = input.required<Player>();
  @Output() finishedStepEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.new();
  }

  new(): void {
    this.index = this.player().currentRoomWins.length;

    if (this.index === this.room().responses.length) {
      this.isOver = true;
    }
  }

  handleEvent(stepWon: boolean): void {
    this.finishedStepEvent.emit(stepWon);
  }
}
