import { Inject, Injectable } from '@angular/core';
import { AI, GenerativeModel, getGenerativeModel } from 'firebase/ai';
import { Observable, from } from 'rxjs';
import { AiResponse } from '../interfaces/ai-response';
import { Room } from '../interfaces/room';
import { promptPrefix } from 'src/assets/data/prompt-prefix';
import { QuizCategory } from '../enums/quiz-category';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private model: GenerativeModel;

  constructor(@Inject('AI') private ai: AI) {
    this.model = getGenerativeModel(this.ai, { model: 'gemini-2.5-flash' });
  }

  generate(room: Room): Observable<string> {
    const promise = this.model
      .generateContent(this.createPrompt(room))
      .then((result) => {
        return result.response.text();
      });

    return from(promise);
  }

  createPrompt(room: Room): string {
    const stepsNumber = room.stepsNumber?.toString() || '3';
    const difficultyFilter = this.getDifficulty(room.difficultyFilter);
    const categoryFilter = this.getCategory(room.categoryFilter);

    return promptPrefix
      .replace('[stepsNumber]', stepsNumber)
      .replace('[difficultyFilter]', difficultyFilter)
      .replace('[categoryFilter]', categoryFilter);
  }

  getDifficulty(difficultyFilter: number): string {
    let difficulty = 'moyenne';
    if (difficultyFilter === 1) {
      difficulty = 'facile';
    } else if (difficultyFilter === 3) {
      difficulty = 'difficile';
    }
    return difficulty;
  }

  getCategory(categoryFilter: number): string {
    let category = 'général';
    switch (categoryFilter) {
      case QuizCategory.Sciences:
        category = 'sciences';
        break;
      case QuizCategory.Histoire:
        category = 'histoire';
        break;
      case QuizCategory.Geographie:
        category = 'géographie';
        break;
      case QuizCategory.Arts:
        category = 'arts';
        break;
      case QuizCategory.Sport:
        category = 'sport';
        break;
      default:
        category = 'général';
    }
    return category;
  }

  getAiResponse(text: string): AiResponse {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    const responseJson = JSON.parse(jsonString);
    return { ...responseJson } as AiResponse;
  }
}
