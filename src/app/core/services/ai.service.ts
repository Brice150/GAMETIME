import { Inject, Injectable } from '@angular/core';
import { AI, GenerativeModel, getGenerativeModel } from 'firebase/ai';
import { from, Observable } from 'rxjs';
import { promptPrefix } from 'src/assets/data/prompt-prefix';
import { Difficulty } from '../enums/difficulty.enum';
import { QuizCategory } from '../enums/quiz-category.enum';
import { AiResponse } from '../interfaces/ai-response';
import { ExcludedUserQuestions } from '../interfaces/excluded-user-questions';
import { Room } from '../interfaces/room';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private model: GenerativeModel;

  constructor(@Inject('AI') private ai: AI) {
    this.model = getGenerativeModel(this.ai, { model: 'gemini-2.5-flash' });
  }

  generate(
    room: Room,
    excludedUserQuestions: ExcludedUserQuestions
  ): Observable<string> {
    const promise = this.model
      .generateContent(this.createPrompt(room, excludedUserQuestions))
      .then((result) => {
        return result.response.text();
      });

    return from(promise);
  }

  createPrompt(
    room: Room,
    excludedUserQuestions: ExcludedUserQuestions
  ): string {
    const stepsNumber = room.stepsNumber?.toString() || '3';
    const difficultyFilter = Difficulty[room.difficultyFilter] ?? Difficulty[2];
    const categoryFilter = QuizCategory[room.categoryFilter] ?? QuizCategory[1];
    const excludedDescriptionsString = excludedUserQuestions?.descriptions
      ?.length
      ? '\n' +
        excludedUserQuestions.descriptions.map((d) => `- ${d}`).join('\n')
      : ' Aucune question exclue';

    const finalPrompt = promptPrefix.replace(
      /(Utilise ce format pour créer un quiz basé sur les paramètres :).*/,
      (_, prefix) =>
        `${prefix}\n[stepsNumber] = ${stepsNumber}\n[difficultyFilter] = ${difficultyFilter}\n[categoryFilter] = ${categoryFilter}\n[excludedQuestionDescriptions] =${excludedDescriptionsString}`
    );

    return finalPrompt;
  }

  getAiResponse(text: string): AiResponse {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString) as AiResponse;
  }
}
