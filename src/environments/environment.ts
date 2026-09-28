export const environment = {
  production: false,
  imagePath: './assets/images/',
  functionsRegion: 'europe-west1',
  // Cle publique Web Push, a copier depuis Firebase > Paramètres du projet >
  // Cloud Messaging > Certificats push Web. Vide : les notifications push
  // sont simplement desactivees.
  vapidKey:
    'BFlCGxelH1YTLOOUEeEAM-V2WDrBD0VyTBgqzhJwIYH0DL7LccEh_uffaoNG2hd7Jo4HWjmJONT4GKmgt2JYY68',
  // Publicite. Tant que `enabled` est faux, aucun script publicitaire n'est
  // charge et aucun bandeau de consentement n'est affiche : il n'y a alors
  // aucun traceur soumis a consentement. Voir README, section « Publicité ».
  ads: {
    enabled: false,
    // Identifiant editeur AdSense, de la forme `ca-pub-XXXXXXXXXXXXXXXX`.
    client: '',
    // Recueil du consentement. `google` : message « Confidentialité et
    // messages » d'AdSense, certifie TCF, exige par Google pour diffuser en
    // Europe. `internal` : bandeau de l'application, pour une autre regie.
    cmp: 'google' as 'google' | 'internal',
    // Identifiants des blocs d'annonces. Un bloc sans identifiant n'est pas
    // affiche.
    slots: {
      home: '',
      ranking: '',
    },
  },
  firebase: {
    apiKey: 'AIzaSyB54hrlHdYrQhhrgh8AqIpIZyDaD5e7Jss',
    authDomain: 'game-time-64133.firebaseapp.com',
    projectId: 'game-time-64133',
    storageBucket: 'game-time-64133.firebasestorage.app',
    messagingSenderId: '931441576091',
    appId: '1:931441576091:web:6ecfcc3785bebad70cde3e',
  },
};
