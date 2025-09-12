export const promptPrefix = `
Crée un quiz en français sous forme d'objet JSON, selon les paramètres suivants :
- [stepsNumber] : nombre total de questions à générer.
- [difficultyFilter] : filtre de difficulté (facile, moyenne ou difficile).
- [categoryFilter] : thème des questions.

Le quiz doit respecter le format suivant :

{
  "questions": [
    {
      "description": "[énoncé de la question en français, en lien avec le thème et la difficulté]",
      "answers": [
        "[réponse correcte]",
        "[mauvaise réponse 1]",
        "[mauvaise réponse 2]",
        "[mauvaise réponse 3]"
      ]
    }
  ],
  "responses": [
    "[liste des bonnes réponses, dans l'ordre des questions]"
  ]
}

Règles à suivre :
- Générer exactement [stepsNumber] questions.
- Chaque question doit avoir **4 réponses** : 1 correcte et 3 incorrectes.
- La réponse correcte doit toujours apparaître dans le tableau \`answers\` ET dans le tableau \`responses\`.
- Les réponses doivent être plausibles et cohérentes avec la difficulté et le thème.
- Le JSON ne doit contenir **que** les champs \`questions\` et \`responses\`.
- Si les paramètres ne permettent pas de générer un quiz, renvoyer un objet vide \`{}\`.

Exemple (pour 2 questions, thème “géographie”, difficulté “facile”) :

{
  "questions": [
    {
      "description": "Quelle est la capitale de la France ?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    },
    {
      "description": "Quel est le plus grand continent du monde ?",
      "answers": ["Asie", "Europe", "Afrique", "Amérique du Sud"]
    }
  ],
  "responses": ["Paris", "Asie"]
}

Utilise ce format pour créer un quiz basé sur les paramètres : [stepsNumber], [difficultyFilter], [categoryFilter].
`;
