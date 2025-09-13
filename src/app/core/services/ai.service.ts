import { Inject, Injectable } from '@angular/core';
import { AI, GenerativeModel, getGenerativeModel } from 'firebase/ai';
import { from, Observable } from 'rxjs';
import { promptPrefix } from 'src/assets/data/prompt-prefix';
import { Difficulty } from '../enums/difficulty.enum';
import { QuizCategory } from '../enums/quiz-category.enum';
import { AiResponse } from '../interfaces/ai-response';
import { Room } from '../interfaces/room';

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
    const difficultyFilter = Difficulty[room.difficultyFilter] ?? Difficulty[2];
    const categoryFilter = QuizCategory[room.categoryFilter] ?? QuizCategory[1];

    return promptPrefix
      .replace('[stepsNumber]', stepsNumber)
      .replace('[difficultyFilter]', difficultyFilter)
      .replace('[categoryFilter]', categoryFilter);
  }

  getAiResponse(text: string): AiResponse {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    const responseJson = JSON.parse(jsonString);
    return { ...responseJson } as AiResponse;
  }
}
