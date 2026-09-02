export const environment = {
  production: false,
  imagePath: './assets/images/',
  functionsRegion: 'europe-west1',
  // Cle publique Web Push, a copier depuis Firebase > Paramètres du projet >
  // Cloud Messaging > Certificats push Web. Vide : les notifications push
  // sont simplement desactivees.
  vapidKey: '',
  firebase: {
    apiKey: 'AIzaSyB54hrlHdYrQhhrgh8AqIpIZyDaD5e7Jss',
    authDomain: 'game-time-64133.firebaseapp.com',
    projectId: 'game-time-64133',
    storageBucket: 'game-time-64133.firebasestorage.app',
    messagingSenderId: '931441576091',
    appId: '1:931441576091:web:6ecfcc3785bebad70cde3e',
  },
};
