/* Kvitteringer, mjau mjau - bakgrunnsskript v3.12: nett først, hurtiglager som reserve (samme som NFK Operations 8.10) */
const LAGER = "stine-app-v3-12";
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

/* Varsler om frister (v3.0): meldingen sendes av jobben i lageret kl. 19 */
self.addEventListener("push", h => {
  let d = {};
  try{ d = h.data ? h.data.json() : {}; }catch{ d = { tekst: h.data ? h.data.text() : "" }; }
  const tittel = d.tittel || "Kvitteringer, mjau mjau";
  h.waitUntil(self.registration.showNotification(tittel, {
    body: d.tekst || "",
    icon: "./ikon-192.png",
    badge: "./ikon-192.png",
    tag: d.tag || "frist",
    data: { url: d.url || "./index.html" }
  }));
});

self.addEventListener("notificationclick", h => {
  h.notification.close();
  const maal = new URL((h.notification.data && h.notification.data.url) || "./index.html", self.location.href).href;
  h.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(liste => {
    for (const k of liste){ if ("focus" in k){ k.navigate(maal).catch(() => {}); return k.focus(); } }
    return self.clients.openWindow(maal);
  }));
});
