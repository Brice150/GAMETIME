export const promptRandomPrefix = `
Crée un quiz en français sous forme d'objet JSON, selon les paramètres suivants :
- [stepsNumber] : nombre total de questions à générer.
- [difficultyFilter] : niveau de difficulté parmi : "primaire", "collège", "lycée", "master", "doctorat".
- [categoriesList] : liste des thèmes pour les questions.
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
- Chaque question doit correspondre à un thème unique de [categoriesList].
- Chaque question doit avoir **4 réponses** : 1 correcte et 3 incorrectes.
- La réponse correcte doit être placée dans \`answers\` et listée dans \`responses\` dans l'ordre des questions.
- Les réponses doivent être plausibles, cohérentes avec le thème et la difficulté, et comporter **au maximum cinq mots**.
- Les descriptions des questions ne doivent jamais être identiques à celles listées dans [excludedQuestionDescriptions].
- Chaque description doit être **une phrase complète**, claire, grammaticalement correcte, et compréhensible même sans contexte.
- Les questions doivent rester concises pour correspondre à des réponses de cinq mots ou moins.
- Le JSON ne doit contenir **que** les champs \`questions\` et \`responses\`.
- Si les paramètres ne permettent pas de générer un quiz, renvoyer un objet vide \`{}\`.

Consignes sur la difficulté ([difficultyFilter]) :
- **Primaire** : questions très simples, notions de base, vocabulaire accessible.
- **Collège** : niveau intermédiaire, connaissances générales ou logiques simples.
- **Lycée** : raisonnement plus poussé, analyse ou culture approfondie.
- **Master** : concepts avancés, explications détaillées, exigence intellectuelle.
- **Doctorat** : niveau recherche, questions complexes et pointues.

Exemple (pour 2 questions, thèmes “géographie” et “histoire”, difficulté “collège”) :

{
  "questions": [
    {
      "description": "Quelle montagne est la plus haute d’Afrique ?",
      "answers": ["Kilimandjaro", "Mont Kenya", "Atlas", "Drakensberg"]
    },
    {
      "description": "Qui a été le premier roi de France ?",
      "answers": ["Clovis", "Charlemagne", "Louis XIV", "Hugues Capet"]
    }
  ],
  "responses": ["Kilimandjaro", "Clovis"]
}

Utilise ce format pour créer un quiz basé sur les paramètres : [stepsNumber], [difficultyFilter], [categoriesList], [excludedQuestionDescriptions], en veillant à générer **une question par thème**.
`;
