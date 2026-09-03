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

- Connexion avec Google, GitHub ou en invité, sans mot de passe à retenir
- Un compte invité peut être lié plus tard à Google ou GitHub sans perdre sa progression
- Déconnexion accessible depuis le menu une fois connecté

---

### 🏠 Accueil

- Sélection du jeu auquel vous souhaitez jouer
- Choix des options de partie

---

### ⚙️ Paramètres

- Onglet Compte : modification du profil, liaison d'un compte invité, suppression du compte (avec confirmation obligatoire)
- Pseudo déjà pris : un pseudo numéroté est proposé et pré-rempli
- Onglet Amis : recherche d'un joueur par son nom, demandes d'ami à accepter ou refuser, retrait d'un ami
- Un ami déjà dans une salle est signalé, avec un bouton pour le rejoindre directement
- Interrupteur de confidentialité : masquer ses parties à ses amis, sans se rendre injoignable

---

### 🎮 Salle

- Une seule fenêtre « Inviter » : liste d’amis, partage natif du lien, code de partie, url et QR code
- Code de la partie affiché en grand dans la salle d’attente, copiable d’un clic
- Notification d’invitation en temps réel dans l’application
- Pendant la partie, chrono en direct et classement provisoire (trophée ou position, manches gagnées, lettres trouvées par chacun) : les joueurs n’ont pas besoin d’être dans la même pièce
- Enchaînement automatique des manches, le résultat de la manche précédente restant rappelé au-dessus de la suivante
- Après une partie, comparaison des résultats avec les autres joueurs
- Vote de fin de partie : recommencer, changer de jeu ou « peu importe », qui montre aussi à l’hôte qui est prêt
- Choix « Aléatoire » à la configuration : le jeu est tiré au sort au lancement
- Un joueur qui arrive alors que la partie est déjà terminée est classé dernier, marqué spectateur, plutôt que de rejouer seul

---

### 📊 Classement

- Onglet Classement : votre position parmi vos amis (par défaut) ou parmi tous les joueurs
- Onglet Succès : découverte des succès à débloquer et des récompenses associées

---

### 🔤 Motus

- Trouver des mots en six essais, le nombre restant s’affichant du vert au rouge
- Indices : première lettre, couleur et soulignement des lettres (plein si bien placée, pointillé si mal placée)
- Récapitulatif de l’alphabet sous la saisie, les lettres exclues étant barrées

---

### 🏳️ Drapeaux

- Deviner des pays en six essais, le nombre restant s’affichant du vert au rouge
- Indices : drapeau, couleur et soulignement des lettres, alphabet récapitulatif

---

### 🏢 Marques

- Deviner des marques à partir de leur logo, en six essais
- Fonctionnement similaire au mode Drapeaux
- Indices : logo, couleur et soulignement des lettres, alphabet récapitulatif

---

### 📲 Application installable

- Proposition d'installation sur l'écran d'accueil, refusable définitivement
- Mise à jour appliquée en silence à la navigation suivante, jamais en pleine manche

---

### 🎲 Aléatoire

- Le jeu est tiré au sort parmi les trois au moment du lancement
- Filtres les plus larges, réglages communs

---

</details>

<details>
  <summary>Installation locale</summary>

### Cloner le projet

```bash
  git clone https://github.com/Brice150/GAMETIME.git
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
