import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { Room } from 'src/app/core/interfaces/room';
import { DifficultyPipe } from 'src/app/shared/pipes/difficulty.pipe';
import { QuizCategoryPipe } from 'src/app/shared/pipes/quiz-category.pipe';

@Component({
  selector: 'app-ai-games',
  imports: [CommonModule, QuizCategoryPipe, DifficultyPipe],
  templateUrl: './ai-games.component.html',
  styleUrl: './ai-games.component.css',
})
export class AiGamesComponent {
  response!: string;
  readonly room = input.required<Room>();
  @Output() finishedStepEvent = new EventEmitter<boolean>();
}
