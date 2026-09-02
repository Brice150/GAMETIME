// Service worker dedie aux notifications push (distinct de ngsw-worker.js,
// qui gere le cache de l'application). Il recoit les messages FCM quand
// l'onglet Game Time est ferme.
importScripts(
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyB54hrlHdYrQhhrgh8AqIpIZyDaD5e7Jss',
  authDomain: 'game-time-64133.firebaseapp.com',
  projectId: 'game-time-64133',
  storageBucket: 'game-time-64133.firebasestorage.app',
  messagingSenderId: '931441576091',
  appId: '1:931441576091:web:6ecfcc3785bebad70cde3e',
});

firebase.messaging();

// Un clic sur la notification doit ouvrir la room, et reutiliser l'onglet
// deja ouvert plutot que d'en empiler un nouveau.
self.addEventListener('notificationclick', (event) => {
  const payload = event.notification && event.notification.data;
  const link =
    (payload && payload.FCM_MSG && payload.FCM_MSG.data && payload.FCM_MSG.data.link) ||
    (payload && payload.link) ||
    '/';
  const url = new URL(link, self.location.origin).href;

  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        return self.clients.openWindow(url);
      }),
  );
});
