// Online: always load the newest version of the app (falls back to the saved copy after 4s).
// Offline: open the saved copy instantly.
const CACHE = "poker-trainer-v3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (isPage) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const saved = () => c.match("./index.html");
      try {
        const net = fetch(url.origin + url.pathname.replace(/index\.html$/, "") + "index.html", { cache: "no-store" });
        const r = await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej("slow"), 4000))]);
        if (r.ok) { c.put("./index.html", r.clone()); return r; }
        return (await saved()) || r;
      } catch (_) { return (await saved()) || Response.error(); }
    })());
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
