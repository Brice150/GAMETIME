import {
  gameCategories,
  gameMap,
  games,
  gamesByCategory,
  buildVoteGroups,
  restartVoteKey,
  randomGameKey,
} from './games';

// La saisie n'accepte que des lettres non accentuees : une reponse qui ne
// tient pas dans ce moule serait introuvable, quoi que tape le joueur.
const TYPEABLE = /^[A-Za-z]+$/;

describe('catalogue des jeux', () => {
  it('rattache chaque jeu a une categorie connue', () => {
    const known = new Set(gameCategories.map((category) => category.key));

    for (const game of games) {
      expect(known.has(game.categoryKey))
        .withContext(`${game.key} -> ${game.categoryKey}`)
        .toBeTrue();
    }
  });

  it('ne laisse aucune categorie vide dans les listes deroulantes', () => {
    for (const group of gamesByCategory()) {
      expect(group.games.length).toBeGreaterThan(0);
    }
  });

  it('range les bulletins par categorie, recommencer et peu importe a part', () => {
    const groups = buildVoteGroups(true);
    const keys = groups.flatMap((group) =>
      group.options.map((option) => option.key),
    );

    expect(keys[0]).toBe(restartVoteKey);
    expect(keys.at(-1)).toBe(randomGameKey);
    expect(keys).toEqual(
      jasmine.arrayContaining(games.map((game) => game.key)),
    );
  });

  it('retire recommencer avant la premiere partie', () => {
    const keys = buildVoteGroups(false).flatMap((group) =>
      group.options.map((option) => option.key),
    );

    expect(keys).not.toContain(restartVoteKey);
  });

  for (const game of games) {
    describe(game.label, () => {
      it('tire le nombre de manches demande, avec des reponses saisissables', async () => {
        const rounds = await game.draw({
          stepsNumber: 8,
          categoryFilter: 1,
          isWordLengthIncreasing: false,
          startWordLength: 5,
        });

        expect(rounds.length).toBe(8);

        for (const round of rounds) {
          expect(TYPEABLE.test(round.response))
            .withContext(`${game.key} : "${round.response}"`)
            .toBeTrue();
        }
      });

      it('ne repete pas une reponse dans une meme partie', async () => {
        const rounds = await game.draw({
          stepsNumber: 8,
          categoryFilter: 1,
          isWordLengthIncreasing: false,
          startWordLength: 5,
        });

        const responses = rounds.map((round) => round.response);
        expect(new Set(responses).size).toBe(responses.length);
      });

      it('ne donne jamais la reponse dans son propre enonce', async () => {
        const rounds = await game.draw({
          stepsNumber: 8,
          categoryFilter: 1,
          isWordLengthIncreasing: false,
          startWordLength: 5,
        });

        for (const round of rounds) {
          expect(round.prompt)
            .withContext(`${game.key} : "${round.prompt}"`)
            .not.toBe(round.response);
        }
      });

      it('remplit chaque filtre propose', async () => {
        const labels = gameMap[game.key].filterLabels ?? [];

        for (let filter = 1; filter <= labels.length; filter++) {
          const rounds = await game.draw({
            stepsNumber: 3,
            categoryFilter: filter,
            isWordLengthIncreasing: false,
            startWordLength: 5,
          });

          expect(rounds.length)
            .withContext(`${game.key} / ${labels[filter - 1]}`)
            .toBe(3);
        }
      });
    });
  }
});
