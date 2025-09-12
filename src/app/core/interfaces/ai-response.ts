import { Question } from './question';

export interface AiResponse {
  questions: Question[];
  responses: string[];
}
