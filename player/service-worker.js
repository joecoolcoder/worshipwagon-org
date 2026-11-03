const CACHE_NAME = "worship-wagon-music-player-v5";
const PLAYER_SHELL = [
  "./",
  "player.js?v=3",
  "../styles.css?v=31",
  "manifest.webmanifest",
  "../assets/img/WW-Logo-cropped.png",
  "../assets/img/ww-music-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PLAYER_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("worship-wagon-music-player-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || !url.pathname.startsWith("/player/")) {
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match("./")));
});
