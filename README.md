<div align="center">
<img height="130px" width="130px" src="./src/assets/images/Logo.webp">
</div>
  
# GAME TIME, une application web de quiz multijoueur

Frontend : Angular
<br>
Backend/BDD : Firebase
<br>

<details>
  <summary>Features</summary>

### 🔐 Connexion

- Inscription via un formulaire avec validation des champs
- Connexion avec animation en cas d’erreur d’identifiants
- Déconnexion accessible depuis le menu une fois connecté

---

### 🏠 Accueil

- Sélection du jeu auquel vous souhaitez jouer
- Choix des options de partie

---

### ⚙️ Paramètres

- Onglet Compte : modification du profil, liaison d'un compte invité, suppression du compte (avec confirmation obligatoire)
- Onglet Amis : recherche d'un joueur par son nom, demandes d'ami à accepter ou refuser, retrait d'un ami

---

### 🎮 Salle

- Partage d’un lien pour permettre aux autres joueurs de rejoindre votre salle
- Invitation directe d’un ami depuis la salle d’attente ou l’écran de résultats
- Notification d’invitation en temps réel dans l’application
- Après une partie, comparaison des résultats avec les autres joueurs
- Un joueur qui arrive alors que la partie est déjà terminée est classé dernier, sans résultat, plutôt que de rejouer seul

---

### 📊 Classement

- Onglet Classement : votre position parmi vos amis (par défaut) ou parmi tous les joueurs
- Onglet Succès : découverte des succès à débloquer et des récompenses associées

---

### 🔤 Motus

- Trouver des mots avec un nombre limité d’essais
- Indices : première lettre, couleurs des lettres (vert et rouge)

---

### 🏳️ Drapeaux

- Deviner des pays avec un nombre limité d’essais
- Indices : drapeau, couleurs des lettres (vert et rouge)

---

### 🏢 Marques

- Deviner des marques à partir de leur logo avec un nombre limité d’essais
- Fonctionnement similaire au mode Drapeaux
- Indices : logo, couleurs des lettres (vert et rouge)

---

### 🤖 Quiz IA

- Répondre à des questions générées par une intelligence artificielle
- 4 réponses proposées avec un seul bon choix
- Sélection du thème des questions
- Choix du niveau de difficulté

---

</details>

<details>
  <summary>Installation locale</summary>

### Cloner le projet

```bash
  git clone https://github.com/Brice150/Life-Rise.git
```

### Installer les dépendances

```bash
  npm install
```

### Lancer l'application

```bash
  ng serve -o
```

</details>
