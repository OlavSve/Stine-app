/* Kvitteringer, mjau mjau - bakgrunnsskript v2.5: nett først, hurtiglager som reserve (samme som NFK Operations 8.10) */
const LAGER = "stine-app-v2-5";
const GRUNN = ["./index.html", "./manifest.webmanifest", "./ikon-192.png", "./ikon-512.png"];

self.addEventListener("install", h => {
  h.waitUntil(caches.open(LAGER).then(l => l.addAll(GRUNN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", h => {
  h.waitUntil(
    caches.keys()
      .then(navn => Promise.all(navn.filter(n => n !== LAGER).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", h => {
  const f = h.request;
  if (f.method !== "GET") return;
  const adresse = new URL(f.url);
  if (adresse.origin !== self.location.origin) return;
  h.respondWith(
    fetch(f)
      .then(svar => {
        if (svar && svar.ok){
          const kopi = svar.clone();
          caches.open(LAGER).then(l => l.put(f, kopi)).catch(() => {});
        }
        return svar;
      })
      .catch(() =>
        caches.match(f).then(t => t || (f.mode === "navigate" ? caches.match("./index.html") : undefined))
      )
  );
});
