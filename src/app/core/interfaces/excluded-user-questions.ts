import { AiTheme } from './ai-theme';

export interface ExcludedUserQuestions {
  id: string;
  themes: AiTheme[];
  userId: string;
}
