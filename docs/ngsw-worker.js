// Ancien service worker de la PWA GitHub Pages, remplace par un "safety
// worker" : au prochain passage du navigateur, il se desinstalle, vide les
// caches et renvoie les onglets ouverts vers la nouvelle adresse Firebase.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();

      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
