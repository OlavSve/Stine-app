/* Kvitteringer, mjau mjau - bakgrunnsskript v4.2: nett først, hurtiglager som reserve (samme som NFK Operations 8.10) */
const LAGER = "stine-app-v4-2";
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

/* Varsler (v3.0, 4.0): meldingene sendes av tjenesten «push» hos Supabase: frister kl. 19, hilsen og bit med en gang */
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

/* Nettleseren byttet ut registreringen (4.1): lag en ny med en gang, appen skriver den inn i tabellen ved neste åpning */
const VAPID_OFFENTLIG = "BBTU9Wt6KuEYzdV7FBa_DvRA0GuUQJ5VFHNRKAHLax822dur8wKsbkS9MfUtZtMi2tKV2ec_MdGeEaLZ0Rd82Ro";
function b64urlTilBytes(s){ const p = "=".repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
self.addEventListener("pushsubscriptionchange", h => {
  h.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlTilBytes(VAPID_OFFENTLIG) }).catch(() => {}));
});

/* Trykk på varselet: et varsel med eget mål (frister, #apne=…) åpner appen der; et varsel uten mål (hilsen, bit, prøve)
   henter fram appen slik den står, uten ny innlasting, og sier fra så hilsenene vises (4.2) */
self.addEventListener("notificationclick", h => {
  h.notification.close();
  const adresse = (h.notification.data && h.notification.data.url) || "./index.html";
  const maal = new URL(adresse, self.location.href).href;
  const harMaal = /#apne=/.test(adresse);
  h.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(liste => {
    for (const k of liste){ if ("focus" in k){ if (harMaal) k.navigate(maal).catch(() => {}); else { try{ k.postMessage({ hva: "hilsen" }); }catch{} } return k.focus(); } }
    return self.clients.openWindow(maal);
  }));
});
