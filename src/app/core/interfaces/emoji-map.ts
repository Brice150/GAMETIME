export type EmojiMap = Record<
  number,
  {
    emojiClass: string;
    emojiStyle: Record<string, string | number>;
  }
>;
