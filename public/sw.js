// Minimal service worker for Safar Anbiya. It exists so the site qualifies as
// an installable PWA (offline support) — required to clear PWABuilder's
// "add a service worker" check. It deliberately never caches API/auth
// responses, and serves page navigations network-first so deployed updates
// show up immediately (important for the TWA, which always loads the live site).

const CACHE = "safar-anbiya-v1";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/brand/png/icon-192.png",
  "/brand/png/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts, audio) pass through
  if (url.pathname.startsWith("/api/")) return; // never cache API/auth responses

  // Network-first for page navigations: always try the live site, fall back to
  // the cached shell only when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first for static assets (Next.js chunks, images, icons).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
    )
  );
});
