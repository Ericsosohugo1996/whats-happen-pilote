// Whazup — « Bars à ne pas manquer » : pour chaque ville de l'appli, repère dans OpenStreetMap (données libres, ODbL)
// les bars les mieux renseignés et les plus typés (cocktails, bière artisanale, vin, terrasse, musique live, bar célèbre…).
// Écrit data/bars-plus/<ville>.json + data/bars-plus/_resume.txt. Lancé une fois par mois par son workflow.
// N'écrase jamais un fichier existant par un résultat vide. Pour tout retirer : supprimer ce fichier, son workflow et data/bars-plus/.
const fs = require("fs");
const path = require("path");

const OUT = path.join("data", "bars-plus");
const MAX = 40;
const MIN_SCORE = 8;
const BIG = new Set(["paris", "lyon", "marseille", "toulouse", "nice", "bordeaux", "nantes", "lille", "strasbourg", "montpellier", "rennes"]);
const URLS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const UA = "Whazup/1.0 (https://whazup.fr)";

function readCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  const out = []; let m;
  while ((m = re.exec(src.slice(start, end)))) out.push({ key: m[1], name: m[2], lat: +m[3], lng: +m[4] });
  return out;
}

const CHAIN = /o'?sullivan|irish tavern|hippopotamus|buffalo grill|columbus|brasserie flo|le comptoir g[ée]n[ée]ral du pmu|pmu|tabac|loto|fdj|press[e]?\b|snack|kebab|pizz|sushi|restaurant/i;
const GENERIC = /^(le |la |l')?(bar|caf[ée]|brasserie|pub|restaurant|bistrot|tabac)( (du|de la|de l'|des) (commerce|centre|sport|poste|gare|march[ée]|palais|mairie|nord|sud|est|ouest|port|marine|place|univers))?$/i;

// tags OSM -> étiquettes lisibles
function features(t) {
  const all = Object.entries(t).map(([k, v]) => k + "=" + v).join(" ").toLowerCase();
  const f = [];
  if (t.outdoor_seating === "yes" || t.terrace === "yes" || /\bterrace/.test(all)) f.push("Terrasse");
  if (t.live_music === "yes" || /live_music|music:live|concert/.test(all)) f.push("Musique live");
  if (/cocktail/.test(all)) f.push("Cocktails");
  if (t.craft === "brewery" || t.microbrewery === "yes" || t.brewery || /craft_beer|real_ale|drink:beer=craft/.test(all)) f.push("Bière artisanale");
  if (/\bwine\b|vin\b|bar=wine|drink:wine=yes/.test(all)) f.push("Vins");
  if (/whisk|rhum|rum|gin\b|spirits/.test(all)) f.push("Spiritueux");
  if (t.food === "yes" || t.cuisine || /tapas|snack|food=/.test(all)) f.push("À manger");
  if (t.karaoke === "yes" || /karaoke/.test(all)) f.push("Karaoké");
  if (/billard|pool|dart|jeux|game/.test(all)) f.push("Jeux");
  if (/sport|tv=yes|screen/.test(all)) f.push("Matchs sur écran");
  return f;
}
function kind(t) {
  const all = Object.entries(t).map(([k, v]) => k + "=" + v).join(" ").toLowerCase();
  if (t.craft === "brewery" || t.microbrewery === "yes") return "Brasserie artisanale";
  if (/cocktail/.test(all) && t.amenity === "bar") return "Bar à cocktails";
  if (/bar=wine|cuisine=wine|wine_bar|drink:wine=yes/.test(all) && !/pub/.test(t.amenity)) return "Bar à vins";
  if (t.amenity === "pub") return "Pub";
  if (t.amenity === "biergarten") return "Biergarten";
  return "Bar";
}
function score(t) {
  let s = 0;
  if (t.wikidata) s += 50;
  if (t.wikipedia) s += 20;
  if (t.website || t["contact:website"]) s += 8;
  if (t.opening_hours) s += 6;
  if (t.phone || t["contact:phone"]) s += 2;
  if (t.heritage || t.historic) s += 6;
  const f = features(t);
  s += f.filter((x) => x === "Cocktails" || x === "Bière artisanale" || x === "Musique live").length * 8;
  s += f.filter((x) => x === "Terrasse" || x === "Vins" || x === "Spiritueux" || x === "Karaoké" || x === "Jeux").length * 4;
  if (t.craft === "brewery" || t.microbrewery === "yes") s += 8;
  s += Math.min(Object.keys(t).length, 20) * 0.4;   // un bar très bien décrit est un bar qui compte pour les contributeurs locaux
  if (CHAIN.test(t.name || "")) s -= 30;
  if (GENERIC.test((t.name || "").trim())) s -= 20;
  if (t.name && t.name.length < 4) s -= 20;
  return s;
}

async function query(c, km) {
  const q = `[out:json][timeout:120];(nwr["amenity"~"^(bar|pub|biergarten)$"]["name"](around:${km * 1000},${c.lat},${c.lng}););out center tags;`;
  let err;
  for (let a = 0; a < 5; a++) {
    for (const u of URLS) {
      try {
        const r = await fetch(u, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
        if (!r.ok) throw new Error(u + " " + r.status);
        return (await r.json()).elements || [];
      } catch (e) { err = e; }
    }
    await new Promise((r) => setTimeout(r, 4000 * (a + 1)));
  }
  throw err;
}

async function images(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    try {
      const r = await fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=" + chunk.join("|"), { headers: { "User-Agent": UA } });
      const j = await r.json();
      for (const id of chunk) {
        const p = j.entities && j.entities[id] && j.entities[id].claims && j.entities[id].claims.P18;
        const f = p && p[0] && p[0].mainsnak && p[0].mainsnak.datavalue && p[0].mainsnak.datavalue.value;
        if (f) out[id] = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f.replace(/ /g, "_"));
      }
    } catch (e) { console.log("images:", e.message); }
  }
  return out;
}

function build(c, els) {
  const seen = new Set(), rows = [];
  for (const e of els) {
    const t = e.tags || {}, lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon);
    if (!t.name || !lat || !lng) continue;
    const key = t.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    const sc = score(t);
    if (sc < MIN_SCORE) continue;
    seen.add(key);
    const addr = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    rows.push({
      id: "osm-" + e.type + "-" + e.id, title: t.name.trim(), lat: +lat.toFixed(6), lng: +lng.toFixed(6),
      kind: kind(t), tags: features(t).slice(0, 4), hours: t.opening_hours || "", address: addr, wikidata: t.wikidata || "", score: Math.round(sc),
    });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, MAX);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cities = readCities();
  const lines = [], all = [];
  let ok = 0;
  for (const c of cities) {
    try {
      const big = BIG.has(c.key);
      const rows = build(c, await query(c, big ? 8 : 6));
      all.push(...rows.filter((r) => r.wikidata).map((r) => r.wikidata));
      lines.push(c.key.padEnd(16) + String(rows.length).padStart(3) + "  " + rows.slice(0, 4).map((r) => r.title + " [" + r.kind + (r.tags.length ? " · " + r.tags.join("/") : "") + "]").join(" | "));
      if (rows.length) { fs.writeFileSync(path.join(OUT, c.key + ".json"), JSON.stringify(rows)); ok++; }
    } catch (e) { lines.push(c.key.padEnd(16) + "ERREUR " + e.message); }
    await new Promise((r) => setTimeout(r, 2500));
  }
  const imgs = await images([...new Set(all)]);
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith(".json"))) {
    const p = path.join(OUT, f), rows = JSON.parse(fs.readFileSync(p, "utf8"));
    let ch = false;
    for (const r of rows) if (r.wikidata && imgs[r.wikidata] && !r.photo) { r.photo = imgs[r.wikidata]; ch = true; }
    if (ch) fs.writeFileSync(p, JSON.stringify(rows));
  }
  lines.unshift("Villes avec au moins 1 bar retenu : " + ok + " / " + cities.length, "");
  fs.writeFileSync(path.join(OUT, "_resume.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { score, features, kind, build };
