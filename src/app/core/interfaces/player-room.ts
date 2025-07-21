export interface PlayerRoom {
  userId: string;
  username: string;
  isOver: boolean;
  medalsNumber: number;
  currentRoomWins: boolean[];
  finishDate: Date | null;
}
