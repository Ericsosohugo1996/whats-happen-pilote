// Robot « Photos DATAtourisme » : récupère la photo principale officielle (avec son auteur) des événements
// importés de DATAtourisme, via l'API officielle et gratuite (clé personnelle dans le secret GitHub DATATOURISME_API_KEY).
// La clé n'est JAMAIS écrite dans un fichier ni affichée dans les journaux.
const fs = require("fs");
const path = require("path");
const START = Date.now();
const TIME_UP = () => Date.now() - START > 17 * 60 * 1000;
const KEY = process.env.DATATOURISME_API_KEY || "";
const BASE = process.env.DT_API || "https://api.datatourisme.fr";
const CACHE = "dt-photos.json";
const MAX_REQ = 900; // l'API accepte 1000 demandes par heure
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function firstText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) { for (const x of v) { const t = firstText(x); if (t) return t; } return ""; }
  if (typeof v === "object") { for (const k of ["@value", "fr", "value", "legalName", "schema:legalName", "foaf:name", "name", "rdfs:label", "label"]) if (k in v) { const t = firstText(v[k]); if (t) return t; } for (const x of Object.values(v)) { const t = firstText(x); if (t) return t; } }
  return "";
}
// cherche dans la représentation principale la première adresse d'image
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
// notre identifiant vient de la fin de l'adresse (« uri ») de l'événement, pas du champ « uuid »
function uuidOf(o) {
  const id = o.uri || o["@id"] || "";
  return String(id).split("/").pop().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
}

async function api(url) {
  const r = await fetch(url, { headers: { "X-API-Key": KEY, "Accept": "application/json" } });
  if (r.status === 429) { await sleep(60000); throw new Error("trop de demandes, on attend"); }
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function main() {
  if (!KEY) { console.log("Pas de clé : le secret DATATOURISME_API_KEY n'est pas configuré. Rien à faire."); return; }
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  if (cache._v !== 1) cache = { _v: 1 };
  const need = new Set();
  for (const f of fs.readdirSync("data/events")) {
    if (!f.endsWith(".json") || f.endsWith(".soon.json")) continue;
    let d = []; try { d = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
    for (const ev of d) if (ev.source === "datatourisme" && String(ev.id).startsWith("dt-") && (ev.photoGeneric || !ev.photo)) need.add(String(ev.id).slice(3));
  }
  console.log("événements DATAtourisme à illustrer :", need.size);
  if (cache._v === 1 && cache._fix !== 2) { for (const k of Object.keys(cache)) if (!k.startsWith("_")) delete cache[k]; cache._next = ""; cache._fix = 2; }
  let url = cache._next || (BASE + "/v1/entertainmentAndEvent?page_size=100&lang=fr&fields=uri,hasMainRepresentation,hasBeenCreatedBy,lastUpdate");
  let req = 0, seen = 0, found = 0, pages = 0, fails = 0;
  while (url && req < MAX_REQ && !TIME_UP()) {
    let j;
    try { j = await api(url); } catch (e) { console.log("échec :", e.message); req++; if (++fails > 5) break; await sleep(3000); continue; }
    req++; pages++;
    const objs = j.objects || j.results || [];
    const withImg = objs.find((x) => x.hasMainRepresentation && JSON.stringify(x.hasMainRepresentation).length > 5);
    if (!cache._sample && withImg) cache._sample = JSON.stringify(withImg).slice(0, 4000); // pour que je puisse vérifier la forme des données
    for (const o of objs) {
      seen++;
      const u = uuidOf(o); if (!u || !need.has(u) || u in cache) continue;
      const rep = o.hasMainRepresentation || o["hasMainRepresentation"] || o.hasRepresentation;
      const img = findImage(rep);
      const creator = firstText(o.hasBeenCreatedBy || o.createdBy || o["hasBeenCreatedBy"]);
      const upd = String(firstText(o.lastUpdate || o["lastUpdate"] || "")).slice(0, 10);
      if (img && /^https:\/\//i.test(img)) { cache[u] = { u: img, a: findRights(rep), s: creator.slice(0, 60), d: upd }; found++; }
      else cache[u] = null;
    }
    const nx = j.meta && j.meta.next;
    url = nx ? (/^https?:/i.test(nx) ? nx : BASE + nx) : "";
    if (pages % 25 === 0) console.log("…", pages, "pages,", seen, "événements vus,", found, "photos");
    await sleep(150);
  }
  cache._next = url || "";
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  console.log("terminé :", pages, "pages,", seen, "événements vus,", found, "photos trouvées.", url ? "Il reste des pages : relance le robot." : "Toutes les pages ont été vues.");
}
main().catch((e) => { console.error(e.message); process.exit(1); });
