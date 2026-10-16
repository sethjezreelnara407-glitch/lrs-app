/* Life Reset System (private web app). Keeps this version of the app on the
   device so it opens offline. A new version is saved in the background and
   used the next time the app is opened fresh. Build 2b0c2719d0f1. */
const CACHE = 'life-reset-2b0c2719d0f1';
const FILES = [
  "./assets/core-Djq8_Zg8.js",
  "./assets/dist-js-CUDI5H8p.js",
  "./assets/dm-mono-latin-400-normal--0xN8mdc.woff",
  "./assets/dm-mono-latin-400-normal-4GdczIuU.woff2",
  "./assets/dm-mono-latin-500-normal-CN8Miw6E.woff",
  "./assets/dm-mono-latin-500-normal-DRMDZjhP.woff2",
  "./assets/esm-BfKXhKbf.js",
  "./assets/esm-Cx827PDv.js",
  "./assets/esm-DOfA7_HU.js",
  "./assets/event-D9RmQ88t.js",
  "./assets/index-BvguS_v2.css",
  "./assets/index-D6wX1Dza.js",
  "./assets/web-Bn7FLMf7.js",
  "./assets/web-C4FwjwPE.js",
  "./assets/web-CEFaeyMu.js",
  "./assets/web-Cv1Hczbb.js",
  "./assets/work-sans-latin-400-normal-DE1_0GuN.woff",
  "./assets/work-sans-latin-400-normal-jUejSri3.woff2",
  "./assets/work-sans-latin-500-normal-BKGnScDy.woff2",
  "./assets/work-sans-latin-500-normal-BmdXWF6_.woff",
  "./assets/work-sans-latin-600-normal-Cg-NlmS7.woff",
  "./assets/work-sans-latin-600-normal-DB-2V89X.woff2",
  "./assets/work-sans-latin-ext-400-normal-j7TZlk-s.woff",
  "./assets/work-sans-latin-ext-400-normal-zfQnhXzv.woff2",
  "./assets/work-sans-latin-ext-500-normal-CAKEIVkc.woff2",
  "./assets/work-sans-latin-ext-500-normal-CW9ss9Cz.woff",
  "./assets/work-sans-latin-ext-600-normal-B1NFRnx8.woff",
  "./assets/work-sans-latin-ext-600-normal-DNiHHggD.woff2",
  "./assets/young-serif-latin-400-normal-D1tz0Z9s.woff",
  "./assets/young-serif-latin-400-normal-DIMmNPI9.woff2",
  "./assets/young-serif-latin-ext-400-normal-4arC2Gh9.woff",
  "./assets/young-serif-latin-ext-400-normal-DzElnxZw.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('life-reset-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // The app is one page (links use #/...): always the saved copy, so it opens offline.
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const saved = await cache.match('./index.html');
        if (saved) return saved;
        return fetch(req);
      })(),
    );
    return;
  }
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(req, { ignoreSearch: true });
      if (saved) return saved;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    })(),
  );
});

// A reminder was tapped: bring the app forward on the page it's about.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = (event.notification.data && event.notification.data.route) || '/';
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of wins) {
        if ('focus' in w) {
          w.postMessage({ type: 'navigate', route });
          await w.focus();
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(new URL('./#' + route, self.registration.scope).href);
    })(),
  );
});
