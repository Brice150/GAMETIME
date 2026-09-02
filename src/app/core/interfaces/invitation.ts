export interface Invitation {
  id?: string;
  roomId: string;
  roomCode: string;
  fromUserId: string;
  fromUsername: string;
  fromAnimal: string;
  toUserId: string;
  createdAt: Date;
}
