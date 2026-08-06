/* 英数逆算プランナー — Service Worker
   役割はオフライン動作のみ。学習データはページ側の LocalStorage にあり、
   ここでは一切扱わない。 */

const CACHE = "gyakusan-v34";
const ASSETS = [
  "./",
  "./index.html",
  "./help.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ネットワーク優先・失敗したらキャッシュ。
   更新をすぐ拾いつつ、圏外でも起動できる。 */
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match("./index.html"))
      )
  );
});
