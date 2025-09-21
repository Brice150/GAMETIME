export const promptPrefix = `
Crée un quiz en français sous forme d'objet JSON, selon les paramètres suivants :
- [stepsNumber] : nombre total de questions à générer.
- [difficultyFilter] : filtre de difficulté (facile, moyenne, avancee ou impossible).
- [categoryFilter] : thème des questions.
- [excludedQuestionDescriptions] : liste des descriptions de questions déjà utilisées et qu'il ne faut jamais reposer.

Le quiz doit respecter le format suivant :

{
  "questions": [
    {
      "description": "[énoncé clair et complet en français, formulé comme une phrase avec sujet et verbe, adapté au thème et à la difficulté, compatible avec des réponses courtes]",
      "answers": [
        "[réponse (correcte ou non), max 5 mots]",
        "[réponse (correcte ou non), max 5 mots]",
        "[réponse (correcte ou non), max 5 mots]",
        "[réponse (correcte ou non), max 5 mots]"
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
- La réponse correcte doit être placée dans \`answers\` et listée dans \`responses\` dans l'ordre des questions.
- Les réponses doivent être plausibles, cohérentes avec le thème et la difficulté, et comporter **au maximum cinq mots**.
- Les descriptions des questions ne doivent jamais être identiques à celles listées dans [excludedQuestionDescriptions].
- Chaque description doit être **une phrase complète**, claire, grammaticalement correcte, et compréhensible même sans contexte.
- Les questions doivent rester concises pour correspondre à des réponses de cinq mots ou moins.
- Le JSON ne doit contenir **que** les champs \`questions\` et \`responses\`.
- Si les paramètres ne permettent pas de générer un quiz, renvoyer un objet vide \`{}\`.

Exemple (pour 2 questions, thème “géographie”, difficulté “moyenne”) :

{
  "questions": [
    {
      "description": "Quelle montagne est la plus haute d’Afrique ?",
      "answers": ["Kilimandjaro", "Mont Kenya", "Atlas", "Drakensberg"]
    },
    {
      "description": "Quel pays possède la plus grande forêt tropicale ?",
      "answers": ["Brésil", "Indonésie", "Congo", "Pérou"]
    }
  ],
  "responses": ["Kilimandjaro", "Brésil"]
}

Utilise ce format pour créer un quiz basé sur les paramètres : [stepsNumber], [difficultyFilter], [categoryFilter], [excludedQuestionDescriptions].
`;
