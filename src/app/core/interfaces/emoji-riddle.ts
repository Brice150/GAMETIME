import { EmojiTheme } from '../enums/emoji-theme.enum';

// `emoji` sert d'enonce, `name` de reponse a taper.
export interface EmojiRiddle {
  emoji: string;
  name: string;
  theme: EmojiTheme;
}
