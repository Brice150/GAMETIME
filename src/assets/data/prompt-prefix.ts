export const promptPrefix = `
Crée un quiz en français sous forme d'objet JSON, selon les paramètres suivants :
- [stepsNumber] : nombre total de questions à générer.
- [difficultyFilter] : filtre de difficulté (facile, moyenne ou difficile).
- [categoryFilter] : thème des questions.

Le quiz doit respecter le format suivant :

{
  "questions": [
    {
      "description": "[énoncé clair en français, adapté au thème et à la difficulté, compatible avec des réponses courtes]",
      "answers": [
        "[réponse correcte, max 3 mots]",
        "[mauvaise réponse 1, max 3 mots]",
        "[mauvaise réponse 2, max 3 mots]",
        "[mauvaise réponse 3, max 3 mots]"
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
- Les réponses doivent être plausibles, cohérentes avec le thème et la difficulté, et comporter **au maximum trois mots**.
- Les questions doivent être formulées de manière concise pour correspondre à des réponses de trois mots ou moins.
- Le JSON ne doit contenir **que** les champs \`questions\` et \`responses\`.
- Si les paramètres ne permettent pas de générer un quiz, renvoyer un objet vide \`{}\`.

Exemple (pour 2 questions, thème “géographie”, difficulté “facile”) :

{
  "questions": [
    {
      "description": "Quelle est la capitale française ?",
      "answers": ["Paris", "Lyon", "Marseille", "Nice"]
    },
    {
      "description": "Plus grand continent ?",
      "answers": ["Asie", "Europe", "Afrique", "Amérique Sud"]
    }
  ],
  "responses": ["Paris", "Asie"]
}

Utilise ce format pour créer un quiz basé sur les paramètres : [stepsNumber], [difficultyFilter], [categoryFilter].
`;
