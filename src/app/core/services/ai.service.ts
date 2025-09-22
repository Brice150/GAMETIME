import { Inject, Injectable } from '@angular/core';
import { AI, GenerativeModel, getGenerativeModel } from 'firebase/ai';
import { from, Observable } from 'rxjs';
import { promptPrefix } from 'src/assets/data/prompt-prefix';
import { promptRandomPrefix } from 'src/assets/data/prompt-random-prefix';
import { themes } from 'src/assets/data/themes';
import { Difficulty } from '../enums/difficulty.enum';
import { AiResponse } from '../interfaces/ai-response';
import { ExcludedUserQuestions } from '../interfaces/excluded-user-questions';
import { Question } from '../interfaces/question';
import { Room } from '../interfaces/room';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private model: GenerativeModel;

  constructor(@Inject('AI') private ai: AI) {
    this.model = getGenerativeModel(this.ai, {
      model: 'gemini-2.5-flash-lite',
    });
  }

  generate(
    room: Room,
    excludedUserQuestions: ExcludedUserQuestions
  ): Observable<string> {
    const run = () =>
      this.model
        .generateContent(this.createPrompt(room, excludedUserQuestions))
        .then((result) => result.response.text());

    const withRetry = (attempt = 1): Promise<string> =>
      run().catch((err) => {
        if (
          err.message?.includes(
            'Gemini Developer API is overloaded. Please try again later.'
          ) &&
          attempt < 3
        ) {
          const delay = 10_000;
          return new Promise((resolve) =>
            setTimeout(() => resolve(withRetry(attempt + 1)), delay)
          );
        }
        throw err;
      });

    return from(withRetry());
  }

  createPrompt(
    room: Room,
    excludedUserQuestions: ExcludedUserQuestions
  ): string {
    const stepsNumber = room.stepsNumber?.toString() || '3';
    const difficultyFilter = Difficulty[room.difficultyFilter] ?? Difficulty[2];

    let categoriesList: string[] = [];
    let promptToUse = promptPrefix;

    if (
      room.categoryFilter &&
      room.categoryFilter.toString() === themes[0].key
    ) {
      promptToUse = promptRandomPrefix;
      categoriesList = themes
        .filter((theme) => theme.key !== themes[0].key)
        .map((theme) => theme.label);
    } else {
      const categoryLabel =
        themes.find((theme) => theme.key === room.categoryFilter.toString())
          ?.label ?? themes[0].label;
      categoriesList = [categoryLabel];
    }

    const excludedDescriptions: string[] = [];

    categoriesList.forEach((category) => {
      const themeForRoom = excludedUserQuestions?.themes?.find(
        (t) => t.categoryFilter.toString() === category
      );
      if (themeForRoom && themeForRoom.descriptions.length > 0) {
        excludedDescriptions.push(...themeForRoom.descriptions);
      }
    });

    const excludedDescriptionsString =
      excludedDescriptions.length > 0
        ? '\n' + excludedDescriptions.map((d) => `- ${d}`).join('\n')
        : ' Aucune question exclue';

    const finalPrompt = promptToUse.replace(
      /(Utilise ce format pour créer un quiz basé sur les paramètres :).*/,
      (_, prefix) =>
        room.categoryFilter.toString() === themes[0].key
          ? `${prefix}\n[stepsNumber] = ${stepsNumber}\n[difficultyFilter] = ${difficultyFilter}\n[categoriesList] = ${JSON.stringify(
              categoriesList
            )}\n[excludedQuestionDescriptions] =${excludedDescriptionsString}`
          : `${prefix}\n[stepsNumber] = ${stepsNumber}\n[difficultyFilter] = ${difficultyFilter}\n[categoryFilter] = ${categoriesList[0]}\n[excludedQuestionDescriptions] =${excludedDescriptionsString}`
    );

    return finalPrompt;
  }

  getAiResponse(text: string): AiResponse {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString) as AiResponse;
  }

  mixResponsesOrder(questions: Question[]): Question[] {
    return questions.map((question) => {
      const shuffledAnswers = [...question.answers];
      for (let i = shuffledAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAnswers[i], shuffledAnswers[j]] = [
          shuffledAnswers[j],
          shuffledAnswers[i],
        ];
      }
      return {
        ...question,
        answers: shuffledAnswers,
      };
    });
  }
}
