// Kill switch for the service worker the old Homer dashboard registered at
// /sw.js. Browsers that still have it fetch this on their next visit; it wipes
// Homer's caches, unregisters itself and reloads open tabs onto the new site.
// Safe to delete once old visitors have come back (or never, it's harmless).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) await caches.delete(key);
      await self.registration.unregister();
      for (const client of await self.clients.matchAll({ type: "window" })) client.navigate(client.url);
    })(),
  );
});
