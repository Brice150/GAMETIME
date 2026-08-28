import { games } from '../../../assets/data/games';
import { Player } from '../interfaces/player';

const activeGameKeys = new Set(games.map((game) => game.key));

/**
 * Somme des médailles d'un joueur, en ignorant les stats des jeux retirés
 * de l'application afin que le total corresponde aux cartes affichées.
 */
export function getTotalMedalsNumber(player: Player | undefined): number {
  if (!player?.stats) {
    return 0;
  }

  return player.stats
    .filter((stat) => activeGameKeys.has(stat.gameName))
    .reduce((sum, stat) => sum + (stat.medalsNumber ?? 0), 0);
}
