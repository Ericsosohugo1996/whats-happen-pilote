// Découpe les 3 gros fichiers de données (événements, lieux, bars) en un petit fichier par ville :
//   data/events/<ville>.json, data/places/<ville>.json, data/bars/<ville>.json
// plus data/index.json (liste des villes disponibles et date de génération).
// Lancé automatiquement par le robot GitHub (.github/workflows/split-data.yml) après chaque mise à jour des gros fichiers.
const fs = require("fs");
const path = require("path");
const { nameMatches } = require("./photo-match.js");
const { pickFor } = require("./type-photos.js");
const { tidyText, tidyPlace } = require("./tidy-text.js");

const SOURCES = [
  { kind: "events", file: "datatourisme-events.json" },
  { kind: "places", file: "datatourisme-places.json" },
  { kind: "bars", file: "osm-bars.json" },
];
const OUT = "data";
const index = { generatedAt: new Date().toISOString(), events: {}, places: {}, bars: {} };

function safe(key) {
  return String(key || "autre").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

for (const { kind, file } of SOURCES) {
  if (!fs.existsSync(file)) { console.log("absent :", file); continue; }
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(items)) { console.log("format inattendu :", file); continue; }
  // lieux OpenStreetMap (osm-places.js) : ils complètent les villes où DataTourisme n'a presque rien
  if (kind === "places" && fs.existsSync("osm-places.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("osm-places.json", "utf8"));
      const have = new Set(items.map((p) => p.id));
      let added = 0;
      if (Array.isArray(extra)) for (const p of extra) if (!have.has(p.id)) { items.push(p); added++; }
      console.log("lieux OpenStreetMap ajoutés :", added);
    } catch (e) { console.log("osm-places.json illisible :", e.message); }
  }
  // événements officiels de la Ville de Paris (paris-events-sync.js) : on les ajoute, sans doublon avec DATAtourisme
  if (kind === "events" && fs.existsSync("paris-events.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("paris-events.json", "utf8"));
      const fold = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const have = new Set(items.filter((e) => e.city === "paris").map((e) => fold(e.title) + "|" + e.date));
      let added = 0;
      if (Array.isArray(extra)) for (const e of extra) {
        const k = fold(e.title) + "|" + e.date;
        if (have.has(k)) continue;
        have.add(k); items.push(e); added++;
      }
      console.log("événements Ville de Paris ajoutés :", added);
    } catch (e) { console.log("paris-events.json illisible :", e.message); }
  }
  // concerts, soirées et sport via Ticketmaster (ticketmaster-sync.js) : on les ajoute, sans doublon (même ville, même titre, même jour)
  if (kind === "events" && fs.existsSync("ticketmaster-events.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("ticketmaster-events.json", "utf8"));
      const fold2 = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const have2 = new Set(items.map((e) => e.city + "|" + fold2(e.title) + "|" + e.date));
      let added2 = 0;
      if (Array.isArray(extra)) for (const e of extra) {
        const k = e.city + "|" + fold2(e.title) + "|" + e.date;
        if (have2.has(k)) continue;
        have2.add(k); items.push(e); added2++;
      }
      console.log("événements Ticketmaster ajoutés :", added2);
    } catch (e) { console.log("ticketmaster-events.json illisible :", e.message); }
  }
  // photos des lieux (trouvées par enrich-photos.js) : on les ajoute aux lieux qui n'en ont pas
  if (kind === "places") {
    let cache = {};
    try { cache = JSON.parse(fs.readFileSync("photos-cache.json", "utf8")); } catch (e) {}
    let n = 0;
    for (const ev of items) {
      const c = cache[ev.id];
      if (c && c.u && !ev.photo && nameMatches(ev.title, c.w)) { ev.photo = c.u; ev.photoCredit = "Wikimedia Commons"; n++; }
    }
    console.log("photos ajoutées aux lieux :", n);
    // lieux toujours sans photo : photo d'illustration de leur type (théâtre, musée…), si type-photos.json existe
    let typePhotos = null;
    try { typePhotos = JSON.parse(fs.readFileSync("type-photos.json", "utf8")); } catch (e) {}
    if (typePhotos) {
      let g = 0;
      for (const ev of items) {
        if (ev.photo || ev.category !== "À voir") continue;
        const p = pickFor(ev, typePhotos);
        if (p) { ev.photo = p.u; ev.photoCredit = p.c; ev.photoGeneric = true; g++; }
      }
      console.log("photos d'illustration ajoutées :", g);
    }
  }
  // titres et lieux écrits EN MAJUSCULES par les organisateurs : on les remet en forme normale
  if (kind === "events" || kind === "places") {
    let n = 0;
    for (const ev of items) {
      const t = tidyText(ev.title), pl = tidyPlace(ev.place);
      if (t !== ev.title || pl !== ev.place) n++;
      ev.title = t; ev.place = pl;
    }
    console.log("titres/lieux remis en forme :", n);
  }
  const byCity = {};
  for (const ev of items) (byCity[safe(ev.city)] = byCity[safe(ev.city)] || []).push(ev);
  const dir = path.join(OUT, kind);
  fs.mkdirSync(dir, { recursive: true });
  // on supprime les fichiers de villes qui n'existent plus, pour ne pas garder de vieilles données
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json") && !byCity[f.slice(0, -5)]) fs.unlinkSync(path.join(dir, f));
  for (const [city, list] of Object.entries(byCity)) {
    const json = JSON.stringify(list);
    const target = path.join(dir, city + ".json");
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== json) fs.writeFileSync(target, json);
    index[kind][city] = list.length;
  }
  console.log(kind + " :", items.length, "éléments,", Object.keys(byCity).length, "villes");
}
// l'index ne change pas la date si rien d'autre n'a changé : on conserve l'ancienne date dans ce cas
const idxPath = path.join(OUT, "index.json");
try {
  const old = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  const same = JSON.stringify([old.events, old.places, old.bars]) === JSON.stringify([index.events, index.places, index.bars]);
  if (same) index.generatedAt = old.generatedAt;
} catch (e) {}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(idxPath, JSON.stringify(index));
