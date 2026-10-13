// Whazup — concerts, soirées électro et sport via l'API Discovery de Ticketmaster.
// Lancé chaque jour par .github/workflows/ticketmaster-events.yml. Écrit ticketmaster-events.json
// (même format que paris-events.json). La clé est lue dans le secret GitHub TICKETMASTER_KEY.
// Chaque événement garde le lien Ticketmaster (billetterie), comme l'exigent les conditions d'utilisation.
const fs = require("fs");

const OUT = "ticketmaster-events.json";
const REPORT = "ticketmaster-report.txt";
const KEY = process.env.TICKETMASTER_KEY || "";
const BASE = process.env.TM_BASE || "https://app.ticketmaster.com/discovery/v2/events.json";
const DAYS_AHEAD = 60;
const RADIUS_KM = 20;
const report = [];
const log = (...a) => { const s = a.join(" "); console.log(s); report.push(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// villes du site, lues dans app.js (const CITIES = { clé: { name, lat, lng, ... } })
function loadCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {");
  const end = src.indexOf("\n};", start);
  const block = src.slice(start, end);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  const out = []; let m;
  while ((m = re.exec(block))) out.push({ key: m[1], name: m[2], lat: +m[3], lng: +m[4] });
  return out;
}
function km(a, b, c, d) {
  const R = 6371, t = (x) => (x * Math.PI) / 180;
  const x = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function isoZ(d) { return d.toISOString().replace(/\.\d{3}Z$/, "Z"); }

function classify(ev) {
  const cl = (ev.classifications || [])[0] || {};
  const seg = fold(cl.segment && cl.segment.name), genre = fold(cl.genre && cl.genre.name), sub = fold(cl.subGenre && cl.subGenre.name);
  const time = ev.dates && ev.dates.start && ev.dates.start.localTime || "";
  if (seg === "music") {
    if (/dance|electronic|club|techno|house/.test(genre + " " + sub)) return ["village", "Soirée"];
    return ["musique", "Musique"];
  }
  if (seg === "sports") return ["sport", "Sport"];
  if (seg === "arts & theatre") {
    const g = genre + " " + sub;
    if (/fine art|museum|exhibit|cultural|visual/.test(g)) return null; // expositions : déjà couvertes ailleurs
    return ["spectacle", "Spectacles", /comedy|humou?r|stand.?up|one.?man/.test(g) ? "humour" : /theat|play|drama|musical/.test(g) ? "theatre" : /dance|ballet/.test(g) ? "danse" : /circus|magic|illusion|specialty|variety/.test(g) ? "cirque" : /opera/.test(g) ? "opera" : /child|family|kid/.test(g) ? "enfants" : ""];
  }
  return null; // le reste n'est pas repris
}
function bestImage(ev) {
  const imgs = (ev.images || []).filter((i) => i.url && !i.fallback);
  if (!imgs.length) return "";
  const wide = imgs.filter((i) => i.ratio === "16_9" && i.width >= 640).sort((a, b) => a.width - b.width);
  return (wide[0] || imgs.sort((a, b) => b.width - a.width)[0]).url;
}
function priceOf(ev) {
  const p = (ev.priceRanges || [])[0];
  if (p && p.min != null) return "Dès " + Math.round(p.min) + (p.currency === "EUR" || !p.currency ? " €" : " " + p.currency);
  return "Billetterie en ligne";
}

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "whazup-sync/1.0 (+https://whazup.fr)" } });
      if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
      if (!res.ok) return { error: "HTTP " + res.status };
      return { json: await res.json() };
    } catch (e) { await sleep(1000 * (attempt + 1)); }
  }
  return { error: "échec réseau" };
}

(async () => {
  if (!KEY) { log("Pas de clé TICKETMASTER_KEY : rien à faire."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  const cities = loadCities();
  log("Villes lues dans app.js :", cities.length);
  if (cities.length < 20) { log("Trop peu de villes : on s'arrête, ancien fichier conservé."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  let prev = {};
  try { for (const e of JSON.parse(fs.readFileSync(OUT, "utf8"))) prev[e.id] = e.createdAt; } catch (e) {}

  const now = new Date(), end = new Date(now.getTime() + DAYS_AHEAD * 86400000);
  const found = new Map(); // id Ticketmaster -> {ev, dist}
  let calls = 0, errors = 0;
  // une recherche séparée par type (musique, sport, spectacles) : sinon un type pousse les autres hors des 5 pages
  for (const c of cities) {
   for (const cls of ["music", "sports", "arts & theatre"]) {
    for (let page = 0; page < 5; page++) {
      const q = new URLSearchParams({
        apikey: KEY, latlong: c.lat + "," + c.lng, radius: String(RADIUS_KM), unit: "km", countryCode: "FR",
        startDateTime: isoZ(now), endDateTime: isoZ(end), size: "200", page: String(page), sort: "date,asc", locale: "*",
        classificationName: cls,
      });
      calls++;
      const r = await getJson(BASE + "?" + q.toString());
      await sleep(250); // 5 appels par seconde maximum
      if (r.error) { errors++; log("Erreur", c.key, cls, r.error); break; }
      const list = (r.json._embedded && r.json._embedded.events) || [];
      for (const ev of list) {
        const ven = ev._embedded && ev._embedded.venues && ev._embedded.venues[0];
        const loc = ven && ven.location;
        if (!loc) continue;
        const lat = +loc.latitude, lng = +loc.longitude;
        if (!isFinite(lat) || !isFinite(lng)) continue;
        const d = km(c.lat, c.lng, lat, lng);
        const old = found.get(ev.id);
        if (!old || d < old.dist) found.set(ev.id, { ev, dist: d, city: c.key, lat, lng, ven });
      }
      const pg = r.json.page || {};
      if (page + 1 >= (pg.totalPages || 1)) break;
    }
   }
  }
  log("Appels :", calls, "— erreurs :", errors, "— événements distincts :", found.size);
  if (errors > cities.length / 2) { log("Trop d'erreurs : ancien fichier conservé."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }

  const out = [], seen = new Set(), stats = { annule: 0, horsCategorie: 0, ok: 0 };
  for (const { ev, city, lat, lng, ven } of found.values()) {
    const st = ev.dates && ev.dates.status && ev.dates.status.code;
    if (st === "cancelled" || st === "canceled") { stats.annule++; continue; }
    const cat = classify(ev);
    if (!cat) { stats.horsCategorie++; continue; }
    const start = ev.dates && ev.dates.start;
    if (!start || !start.localDate) continue;
    const title = String(ev.name || "").replace(/\s+/g, " ").trim();
    if (!title) continue;
    const key = fold(title) + "|" + start.localDate + "|" + lat.toFixed(3);
    if (seen.has(key)) continue; seen.add(key);
    const id = "tm-" + ev.id;
    const place = [ven.name, ven.address && ven.address.line1, [ven.postalCode, ven.city && ven.city.name].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const o = {
      id, scene: cat[0], city, category: cat[1], title, date: start.localDate, time: (start.localTime || "").slice(0, 5),
      place, lat, lng, price: priceOf(ev), thumb: "", source: "ticketmaster", createdAt: prev[id] || Date.now(),
      description: String(ev.info || ev.pleaseNote || "").replace(/\s+/g, " ").slice(0, 300) || ("Billetterie : " + (ven.name || "Ticketmaster")),
    };
    if (cat[2]) o.kind = cat[2];
    if (ev.url) o.link = ev.url;
    const img = bestImage(ev); if (img) { o.photo = img; o.photoCredit = "Ticketmaster"; }
    out.push(o); stats.ok++;
  }
  out.sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  log("Résultat :", JSON.stringify(stats));
  const by = {}, byCity = {};
  for (const e of out) { by[e.category] = (by[e.category] || 0) + 1; byCity[e.city] = (byCity[e.city] || 0) + 1; }
  log("Par catégorie :", JSON.stringify(by));
  log("Villes couvertes :", Object.keys(byCity).length, "— top :", JSON.stringify(Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 8)));
  if (out.length < 20) { log("Trop peu d'événements : ancien fichier conservé."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  fs.writeFileSync(OUT, JSON.stringify(out));
  fs.writeFileSync(REPORT, report.join("\n") + "\n");
})();
