/* Life Reset System (private web app). Keeps this version of the app on the
   device so it opens offline. When a new version is published, it is saved in
   the background, takes over right away and reloads the open app once.
   Build e8c8bee1ff42. */
const CACHE = 'life-reset-e8c8bee1ff42';
const FILES = [
  "./assets/core-Djq8_Zg8.js",
  "./assets/dist-js-CUDI5H8p.js",
  "./assets/dm-mono-latin-400-normal--0xN8mdc.woff",
  "./assets/dm-mono-latin-400-normal-4GdczIuU.woff2",
  "./assets/dm-mono-latin-500-normal-CN8Miw6E.woff",
  "./assets/dm-mono-latin-500-normal-DRMDZjhP.woff2",
  "./assets/esm-BKuM00-3.js",
  "./assets/esm-COGcqb08.js",
  "./assets/esm-DFlpLPvE.js",
  "./assets/event-D9RmQ88t.js",
  "./assets/index-BB-M72jB.css",
  "./assets/index-BtgFdjiW.js",
  "./assets/web-CG4wdWCd.js",
  "./assets/web-D5ORKI17.js",
  "./assets/web-DBbCd9J-.js",
  "./assets/web-mcDq7-hX.js",
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
  // Take over as soon as this version is saved: an update never waits for every tab to close.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const older = keys.filter((k) => k.startsWith('life-reset-') && k !== CACHE);
      await Promise.all(older.map((k) => caches.delete(k)));
      await self.clients.claim();
      // An update (not a first install): reload windows still showing the older version.
      // Not awaited: the reload can only be answered once this worker has finished activating.
      if (older.length) {
        const wins = await self.clients.matchAll({ type: 'window' });
        for (const w of wins) {
          if ('navigate' in w) w.navigate(w.url).catch(() => {});
        }
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // The app is one page (links use #/...). Online: the newest page, so a new version
    // shows up right away. Offline or a slow connection: the saved copy, so it still opens.
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const saved = await cache.match('./index.html');
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), saved ? 3500 : 20000);
          const res = await fetch(url.href, { cache: 'no-store', credentials: 'same-origin', signal: ctrl.signal });
          clearTimeout(timer);
          if (res.ok) return res;
        } catch (e) {
          /* offline or slow */
        }
        return saved || fetch(req);
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
