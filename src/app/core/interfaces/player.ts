import { Stat } from './stat';

export interface Player {
  id: string;
  userId?: string;
  username: string;
  isAdmin: boolean;
  stats: Stat[];
}
