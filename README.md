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

- Une seule fenêtre « Inviter » : liste d’amis, code de partie, lien et QR code
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
