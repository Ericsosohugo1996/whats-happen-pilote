// Robot « Photos officielles des bars (DATAtourisme) » — TEST : ne modifie RIEN dans l'appli.
// Télécharge les bars de DATAtourisme qui ont une photo, les rapproche de nos bars (nom proche et < 80 m)
// et écrit le compte rendu. Relançable : il reprend où il s'est arrêté (limite 1000 demandes/heure).
const fs = require("fs");
const DIR = "data/bars-plus";
const CACHE = DIR + "/_dt-bars-cache.json";
const BASE = "https://api.datatourisme.fr";
const KEY = process.env.DATATOURISME_API_KEY || "";
const TYPES = ["BarOrPub", "BistroOrWineBar"];
const MAX_REQ = 850;
const START = Date.now();
const TIME_UP = () => Date.now() - START > 40 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function firstText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) { for (const x of v) { const t = firstText(x); if (t) return t; } return ""; }
  if (typeof v === "object") { for (const k of ["@value", "fr", "value", "legalName", "schema:legalName", "foaf:name", "name", "rdfs:label", "label"]) if (k in v) { const t = firstText(v[k]); if (t) return t; } for (const x of Object.values(v)) { const t = firstText(x); if (t) return t; } }
  return "";
}
function findImage(rep) {
  let out = "";
  (function walk(v, key) {
    if (out || v == null) return;
    if (typeof v === "string") { if (/^https?:\/\//i.test(v) && (/locator|url|contentUrl|source/i.test(key || "") || /\.(jpe?g|png|webp)(\?|$)/i.test(v))) out = v; return; }
    if (Array.isArray(v)) { for (const x of v) walk(x, key); return; }
    if (typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  })(rep, "");
  return out;
}
function findRights(rep) {
  let holder = "";
  (function walk(v, key) {
    if (holder || v == null) return;
    if (Array.isArray(v)) { for (const x of v) walk(x, key); return; }
    if (typeof v === "object") { for (const [k, x] of Object.entries(v)) { if (/rightsHolder|copyright|credit|author|photographer/i.test(k)) { const t = firstText(x); if (t) { holder = t; return; } } walk(x, k); } }
  })(rep, "");
  return holder.replace(/\s+/g, " ").trim().slice(0, 60);
}
function findGeo(o) {
  let la = null, lo = null;
  (function walk(v) {
    if (v == null || (la != null && lo != null)) return;
    if (Array.isArray(v)) { for (const x of v) walk(x); return; }
    if (typeof v === "object") {
      if (v.latitude != null && v.longitude != null && la == null) { la = parseFloat(firstText(v.latitude)); lo = parseFloat(firstText(v.longitude)); return; }
      for (const x of Object.values(v)) walk(x);
    }
  })(o.isLocatedAt);
  return isFinite(la) && isFinite(lo) ? [la, lo] : null;
}
async function api(url) {
  const r = await fetch(url, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  if (r.status === 429) { await sleep(60000); throw new Error("trop de demandes"); }
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\b(le|la|les|l|du|de|des|the|bar|pub|cafe|brasserie|restaurant|chez|et|au|aux)\b/g, " ").replace(/\s+/g, " ").trim();
function similar(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const A = new Set(x.split(" ")), B = new Set(y.split(" "));
  let i = 0; for (const t of A) if (B.has(t)) i++;
  return i / Math.max(A.size, B.size) >= 0.5;
}
function km(a, b, c, d) {
  const t = Math.PI / 180, dl = (c - a) * t, dn = (d - b) * t;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(dn / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}
(async () => {
  if (!KEY) { console.log("Pas de clé DATATOURISME_API_KEY."); return; }
  let cache = { ti: 0, next: "", pages: 0, seen: 0, rows: [] };
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  let req = 0, fails = 0;
  while (cache.ti < TYPES.length && req < MAX_REQ && !TIME_UP()) {
    const url = cache.next || BASE + "/v1/placeOfInterest?page_size=100&lang=fr&type=" + TYPES[cache.ti] + "&fields=uri,label,type,isLocatedAt,hasMainRepresentation,hasBeenCreatedBy";
    let j;
    try { j = await api(url); } catch (e) { console.log("échec :", e.message); req++; if (++fails > 5) break; await sleep(3000); continue; }
    req++; cache.pages++;
    for (const o of j.objects || []) {
      cache.seen++;
      const rep = o.hasMainRepresentation || o.hasRepresentation;
      const img = findImage(rep);
      const g = findGeo(o);
      if (img && /^https:\/\//i.test(img) && g) cache.rows.push({ n: firstText(o.label).slice(0, 80), la: g[0], lo: g[1], u: img, a: findRights(rep), s: firstText(o.hasBeenCreatedBy).slice(0, 60) });
    }
    const nx = j.meta && j.meta.next;
    if (nx) cache.next = /^https?:/i.test(nx) ? nx : BASE + nx; else { cache.next = ""; cache.ti++; }
    if (cache.pages % 25 === 0) console.log("…", cache.pages, "pages,", cache.seen, "vus,", cache.rows.length, "avec photo");
    await sleep(200);
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  const done = cache.ti >= TYPES.length;
  // rapprochement avec nos bars
  const ours = [];
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))) {
    try { for (const b of JSON.parse(fs.readFileSync(DIR + "/" + f, "utf8"))) if (b && b.id && b.lat && b.lng) ours.push({ city: f.replace(".json", ""), id: b.id, title: b.title, lat: b.lat, lng: b.lng, has: !!b.photo }); } catch (e) {}
  }
  const matches = [];
  for (const b of ours) {
    let best = null;
    for (const r of cache.rows) {
      if (Math.abs(r.la - b.lat) > 0.002 || Math.abs(r.lo - b.lng) > 0.003) continue;
      if (km(b.lat, b.lng, r.la, r.lo) > 0.08) continue;
      if (similar(b.title, r.n)) { best = r; break; }
    }
    if (best) matches.push({ id: b.id, city: b.city, title: b.title, dt: best.n, photo: best.u, author: best.a, source: best.s, had: b.has });
  }
  const lines = [];
  lines.push("DATAtourisme : " + cache.pages + " pages lues, " + cache.seen + " lieux vus, " + cache.rows.length + " avec photo et position. " + (done ? "TERMINÉ." : "PAS FINI : relance le robot."));
  lines.push("Nos bars : " + ours.length + ". Rapprochés avec une photo officielle : " + matches.length + " (dont " + matches.filter((m) => !m.had).length + " sans photo aujourd'hui).");
  const byCity = {}; for (const m of matches) byCity[m.city] = (byCity[m.city] || 0) + 1;
  lines.push("Par ville : " + Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 12).map((e) => e[0] + " " + e[1]).join(", "));
  for (const m of matches.slice(0, 8)) lines.push("exemple : " + m.city + " / " + m.title + " = " + m.dt + " (auteur : " + (m.author || "?") + " ; fournisseur : " + (m.source || "?") + ")");
  console.log(lines.join("\n"));
  fs.writeFileSync(DIR + "/_dt-resume.txt", lines.join("\n") + "\n");
  fs.writeFileSync(DIR + "/_dt-matches.json", JSON.stringify(matches));
})();
