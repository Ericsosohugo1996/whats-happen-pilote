// Lieux à voir (musées, monuments, théâtres, parcs…) depuis OpenStreetMap, pour les villes
// où la base DataTourisme n'en contient presque pas (ex. Toulouse).
// Lancé par le robot GitHub "Lieux OpenStreetMap" (.github/workflows/osm-places.yml).
// Écrit osm-places.json, que split-data.js fusionne avec les lieux DataTourisme.
// Licence des données : ODbL © contributeurs OpenStreetMap (voir CREDITS.md).
const fs = require("fs");

const MIN_DT_PLACES = 15;          // en dessous, la ville est complétée avec OpenStreetMap
const RADIUS_M = 10000;            // rayon autour du centre-ville
const MAX_PER_CITY = 90;
const OUTPUT = "osm-places.json";
const URLS = (process.env.OVERPASS_URL ? [process.env.OVERPASS_URL] : [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]);
const UA = "Whazup/1.0 (https://whazup.fr; contact: whazup.fr)";

function loadCities() {
  const app = fs.readFileSync("app.js", "utf8");
  const out = {};
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  let m;
  while ((m = re.exec(app))) out[m[1]] = { name: m[2], lat: +m[3], lng: +m[4] };
  return out;
}

function dtCounts() {
  const c = {};
  try {
    for (const p of JSON.parse(fs.readFileSync("datatourisme-places.json", "utf8"))) c[p.city] = (c[p.city] || 0) + 1;
  } catch (e) { console.log("datatourisme-places.json illisible :", e.message); }
  return c;
}

function query(c) {
  const a = `(around:${RADIUS_M},${c.lat},${c.lng})`;
  return `[out:json][timeout:90];(
nwr["tourism"~"^(museum|gallery)$"]["name"]${a};
nwr["tourism"~"^(attraction|viewpoint)$"]["name"]["wikidata"]${a};
nwr["historic"~"^(castle|fort|city_gate|manor|tower|palace|abbey|monastery|archaeological_site|monument|ruins)$"]["name"]${a};
nwr["amenity"~"^(theatre|arts_centre)$"]["name"]${a};
nwr["amenity"="place_of_worship"]["name"]["wikidata"]${a};
nwr["leisure"~"^(park|garden)$"]["name"]["wikidata"]${a};
);out center tags 500;`;
}

const BAD_NAME = /\b(morts?|stèle|stele|plaque|calvaire|lavoir|fontaine|borne|croix|cimeti|toilette|parking|boutique|librairie|billetterie|gare)\b/i;

function kindOf(t) {
  if (t.tourism === "museum") return { label: "Musée", w: 5 };
  if (t.tourism === "gallery") return { label: "Galerie d'art", w: 3 };
  if (t.amenity === "theatre") return { label: "Théâtre", w: 4 };
  if (t.amenity === "arts_centre") return { label: "Centre d'art", w: 3 };
  if (t.amenity === "place_of_worship") return { label: "Lieu de culte", w: 3 };
  if (t.leisure === "park" || t.leisure === "garden") return { label: "Parc et jardin", w: 2 };
  if (t.historic === "castle" || t.historic === "palace" || t.historic === "fort" || t.historic === "manor") return { label: "Monument historique", w: 5 };
  if (t.historic) return { label: "Site historique", w: 3 };
  if (t.tourism === "viewpoint") return { label: "Point de vue", w: 2 };
  return { label: "Lieu à visiter", w: 2 };
}

function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(q) {
  let lastErr = "";
  for (let round = 0; round < 3; round++) {
    for (const url of URLS) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: "data=" + encodeURIComponent(q),
          signal: AbortSignal.timeout(120000),
        });
        if (res.ok) return await res.json();
        lastErr = url + " → HTTP " + res.status;
      } catch (e) { lastErr = url + " → " + e.message; }
      await sleep(3000);
    }
    await sleep(8000 * (round + 1));
  }
  throw new Error(lastErr);
}

function toPlaces(key, c, elements) {
  const seen = new Set();
  const scored = [];
  for (const el of elements) {
    const t = el.tags || {};
    const name = (t.name || "").trim();
    const lat = el.lat != null ? el.lat : el.center && el.center.lat;
    const lng = el.lon != null ? el.lon : el.center && el.center.lon;
    if (!name || name.length < 4 || BAD_NAME.test(name) || lat == null || lng == null) continue;
    const nk = norm(name);
    if (seen.has(nk)) continue;
    seen.add(nk);
    const k = kindOf(t);
    const dist = Math.hypot((lat - c.lat) * 111, (lng - c.lng) * 111 * Math.cos(c.lat * Math.PI / 180));
    const score = k.w + (t.wikidata ? 3 : 0) + (t.wikipedia ? 1 : 0) - dist * 0.25;
    const street = t["addr:street"] ? ((t["addr:housenumber"] ? t["addr:housenumber"] + " " : "") + t["addr:street"] + ", ") : "";
    scored.push({
      score,
      p: {
        id: "osm-place-" + el.type + "-" + el.id,
        isPlace: true, scene: "village", city: key, category: "À voir", title: name,
        date: null, time: "", place: street + c.name, lat: +lat.toFixed(6), lng: +lng.toFixed(6),
        price: "Voir sur place", thumb: "", source: "openstreetmap", createdAt: Date.now(),
        description: (t.description ? String(t.description).slice(0, 300) + " " : "") + k.label + " référencé sur OpenStreetMap.",
      },
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_PER_CITY).map((x) => x.p);
}

async function main() {
  const cities = loadCities();
  const counts = dtCounts();
  const targets = Object.keys(cities).filter((k) => (counts[k] || 0) < MIN_DT_PLACES);
  console.log("villes à compléter :", targets.length, targets.join(", "));
  let previous = [];
  try { previous = JSON.parse(fs.readFileSync(OUTPUT, "utf8")); } catch (e) {}
  const oldCreated = {};
  for (const p of previous) oldCreated[p.id] = p.createdAt;
  const byCity = {};
  for (const p of previous) (byCity[p.city] = byCity[p.city] || []).push(p);
  let ok = 0, fail = 0;
  for (const key of targets) {
    try {
      const data = await overpass(query(cities[key]));
      const list = toPlaces(key, cities[key], data.elements || []);
      if (list.length) { list.forEach((p) => { if (oldCreated[p.id]) p.createdAt = oldCreated[p.id]; }); byCity[key] = list; ok++; }
      console.log(key, "→", list.length, "lieux");
    } catch (e) { fail++; console.log(key, "ÉCHEC :", e.message); }
    await sleep(2500);
  }
  // on ne garde que les villes encore à compléter (si DataTourisme a fini par en fournir, on laisse tomber OSM)
  const keep = new Set(targets);
  const out = [];
  for (const k of Object.keys(byCity).sort()) if (keep.has(k)) out.push(...byCity[k]);
  console.log("total :", out.length, "lieux ;", ok, "villes réussies,", fail, "échecs");
  if (!out.length) { console.log("rien à écrire"); process.exit(ok === 0 && fail > 0 ? 1 : 0); }
  const json = JSON.stringify(out);
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== json) fs.writeFileSync(OUTPUT, json);
}

main().catch((e) => { console.error(e); process.exit(1); });
