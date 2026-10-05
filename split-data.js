// Découpe les 3 gros fichiers de données (événements, lieux, bars) en un petit fichier par ville :
//   data/events/<ville>.json, data/places/<ville>.json, data/bars/<ville>.json
// plus data/index.json (liste des villes disponibles et date de génération).
// Lancé automatiquement par le robot GitHub (.github/workflows/split-data.yml) après chaque mise à jour des gros fichiers.
const fs = require("fs");
const path = require("path");
const { nameMatches } = require("./photo-match.js");
const { pickFor } = require("./type-photos.js");

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
