export interface EmojiMap {
    [key: number]: {
      emojiClass: string;
      emojiStyle: { [klass: string]: any; };
    };
}