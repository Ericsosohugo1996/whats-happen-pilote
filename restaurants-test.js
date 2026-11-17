// Whazup — ESSAI « Restaurants à découvrir » v2 (OpenStreetMap, données libres ODbL) : sans photo, favorise les adresses cachées.
// N'a AUCUN effet sur le site : écrit seulement data/restaurants-test/<ville>.json et data/restaurants-test/_resume.txt.
// Pour tout retirer : supprimer ce fichier, son workflow et le dossier data/restaurants-test/.
const fs = require("fs");
const path = require("path");

const OUT = path.join("data", "restaurants-test");
const MAX = 30;
const MIN_SCORE = 14;
const UA = "Whazup/1.0 (https://whazup.fr)";
const URLS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
// 40 grandes villes de France
const CITIES = [
  { key: "paris", name: "Paris", lat: 48.8566, lng: 2.3522, km: 8, max: 150 },
  { key: "lyon", name: "Lyon", lat: 45.764, lng: 4.835, km: 7, max: 150 },
  { key: "marseille", name: "Marseille", lat: 43.296, lng: 5.37, km: 7, max: 150 },
  { key: "bordeaux", name: "Bordeaux", lat: 44.838, lng: -0.579, km: 7, max: 150 },
  { key: "toulouse", name: "Toulouse", lat: 43.605, lng: 1.444, km: 7, max: 150 },
  { key: "nantes", name: "Nantes", lat: 47.218, lng: -1.553, km: 7, max: 150 },
  { key: "lille", name: "Lille", lat: 50.629, lng: 3.057, km: 7, max: 150 },
  { key: "strasbourg", name: "Strasbourg", lat: 48.573, lng: 7.752, km: 7, max: 150 },
  { key: "nice", name: "Nice", lat: 43.703, lng: 7.266, km: 7, max: 150 },
  { key: "montpellier", name: "Montpellier", lat: 43.611, lng: 3.877, km: 7, max: 150 },
  { key: "rennes", name: "Rennes", lat: 48.117, lng: -1.678, km: 4, max: 60 },
  { key: "grenoble", name: "Grenoble", lat: 45.188, lng: 5.724, km: 4, max: 60 },
  { key: "dijon", name: "Dijon", lat: 47.322, lng: 5.041, km: 4, max: 60 },
  { key: "angers", name: "Angers", lat: 47.478, lng: -0.563, km: 4, max: 60 },
  { key: "tours", name: "Tours", lat: 47.394, lng: 0.684, km: 4, max: 60 },
  { key: "reims", name: "Reims", lat: 49.258, lng: 4.032, km: 4, max: 60 },
  { key: "rouen", name: "Rouen", lat: 49.443, lng: 1.099, km: 4, max: 60 },
  { key: "le-havre", name: "Le Havre", lat: 49.494, lng: 0.108, km: 4, max: 60 },
  { key: "saint-etienne", name: "Saint-Étienne", lat: 45.439, lng: 4.387, km: 4, max: 60 },
  { key: "toulon", name: "Toulon", lat: 43.124, lng: 5.928, km: 4, max: 60 },
  { key: "clermont-ferrand", name: "Clermont-Ferrand", lat: 45.777, lng: 3.087, km: 4, max: 60 },
  { key: "metz", name: "Metz", lat: 49.119, lng: 6.176, km: 4, max: 60 },
  { key: "nancy", name: "Nancy", lat: 48.692, lng: 6.184, km: 4, max: 60 },
  { key: "annecy", name: "Annecy", lat: 45.899, lng: 6.129, km: 4, max: 60 },
  { key: "bayonne", name: "Bayonne", lat: 43.493, lng: -1.475, km: 3, max: 60 },
  { key: "biarritz", name: "Biarritz", lat: 43.483, lng: -1.558, km: 3, max: 60 },
  { key: "la-rochelle", name: "La Rochelle", lat: 46.16, lng: -1.152, km: 3, max: 60 },
  { key: "avignon", name: "Avignon", lat: 43.949, lng: 4.806, km: 3, max: 60 },
  { key: "aix-en-provence", name: "Aix-en-Provence", lat: 43.53, lng: 5.447, km: 4, max: 60 },
  { key: "perpignan", name: "Perpignan", lat: 42.699, lng: 2.895, km: 4, max: 60 },
  { key: "caen", name: "Caen", lat: 49.183, lng: -0.371, km: 4, max: 60 },
  { key: "limoges", name: "Limoges", lat: 45.833, lng: 1.261, km: 4, max: 60 },
  { key: "brest", name: "Brest", lat: 48.39, lng: -4.486, km: 4, max: 60 },
  { key: "poitiers", name: "Poitiers", lat: 46.58, lng: 0.34, km: 4, max: 60 },
  { key: "besancon", name: "Besançon", lat: 47.238, lng: 6.024, km: 4, max: 60 },
  { key: "nimes", name: "Nîmes", lat: 43.837, lng: 4.36, km: 4, max: 60 },
  { key: "pau", name: "Pau", lat: 43.295, lng: -0.37, km: 4, max: 60 },
  { key: "montauban", name: "Montauban", lat: 44.018, lng: 1.355, km: 3, max: 60 },
  { key: "ajaccio", name: "Ajaccio", lat: 41.919, lng: 8.738, km: 4, max: 60 },
  { key: "bastia", name: "Bastia", lat: 42.697, lng: 9.45, km: 3, max: 60 },
];

const CHAIN_RE = /mc ?donald|burger king|\bkfc\b|\bquick\b|subway|domino|pizza hut|buffalo grill|hippopotamus|courtepaille|flunch|\bpaul\b|brioche d[oô]r[ée]e|starbucks|o'? ?tacos|five guys|pitaya|class'? ?croute|la boucherie|l[ée]on de bruxelles|del arte|pizza pa[iï]|bistrot du boucher|tablapizza|la pizza cresci|big fernand|columbus caf|chez ?jean|poulet|poke|wok\b|sushi shop|planet sushi/i;
const FAST_CUISINE_RE = /burger|kebab|fast_food|sandwich|chicken|tacos|pizza/i;
const GENERIC_RE = /^(le |la |l')?(restaurant|brasserie|bistrot|bistro|caf[ée]|auberge|pizzeria|cr[eê]perie)( (du|de la|de l'|des) (commerce|centre|port|march[ée]|gare|poste|place|palais|mairie))?$/i;

const CUISINES = {
  french: "Française", regional: "Terroir", italian: "Italienne", japanese: "Japonaise", chinese: "Chinoise",
  indian: "Indienne", thai: "Thaïlandaise", vietnamese: "Vietnamienne", korean: "Coréenne", lebanese: "Libanaise",
  moroccan: "Marocaine", spanish: "Espagnole", tapas: "Tapas", greek: "Grecque", turkish: "Turque", mexican: "Mexicaine",
  seafood: "Poissons et fruits de mer", fish: "Poissons", steak_house: "Viande", vegetarian: "Végétarienne", vegan: "Végane",
  crepe: "Crêpes", mediterranean: "Méditerranéenne", african: "Africaine", ethiopian: "Éthiopienne", peruvian: "Péruvienne",
  georgian: "Géorgienne", portuguese: "Portugaise", american: "Américaine", asian: "Asiatique", fusion: "Fusion",
  international: "Internationale", bistro: "Bistrot", brasserie: "Brasserie", pizza: "Pizza", burger: "Burger",
};
function cuisineOf(t) {
  const c = String(t.cuisine || "").split(";")[0].trim().toLowerCase();
  return c ? (CUISINES[c] || c.replace(/_/g, " ")) : "";
}
function features(t) {
  const f = [];
  if (t.outdoor_seating === "yes") f.push("Terrasse");
  if (t["diet:vegetarian"] === "yes" || t["diet:vegetarian"] === "only" || t["diet:vegan"] === "yes" || t["diet:vegan"] === "only") f.push("Options végé");
  if (t.organic === "yes" || t.organic === "only") f.push("Bio");
  if (t.wheelchair === "yes") f.push("Accessible");
  if (t.takeaway === "only") f.push("À emporter");
  return f;
}
function isChain(t) {
  const name = t.name || "";
  if (t.brand || t["brand:wikidata"] || t.operator && /group|groupe|holding|franchise/i.test(t.operator)) return true;
  if (CHAIN_RE.test(name)) return true;
  if (FAST_CUISINE_RE.test(String(t.cuisine || "")) && !t.wikidata) return true;
  return false;
}
function score(t) {
  let s = 0;
  if (t.wikidata) s += 40;
  if (t.wikipedia) s += 15;
  if (t.stars || t["award:michelin"] || t.michelin || Object.keys(t).some((k) => /^award:|^michelin|^gault/i.test(k))) s += 30;
  if (t.website || t["contact:website"]) s += 8;
  if (t.opening_hours) s += 6;
  if (t.phone || t["contact:phone"]) s += 2;
  if (t.description || t["description:fr"]) s += 8;
  if (cuisineOf(t)) s += 6;
  if (t.heritage || t.historic) s += 10;
  if (t["diet:vegetarian"] || t["diet:vegan"] || t.organic) s += 3;
  if (t.outdoor_seating === "yes") s += 3;
  s += Math.min(Object.keys(t).length, 20) * 0.4;
  // signes d'une adresse « cachée » : cave, cour, toit, péniche, bâtiment ancien, description qui parle d'un lieu insolite
  const txt = String((t["description:fr"] || t.description || "") + " " + (t.name || "")).toLowerCase();
  if (/\b(cave|cour|cachée?|secret|insolite|ancien(ne)?|chapelle|moulin|péniche|rooftop|toit|jardin|atelier|passage|arrière)\b/.test(txt)) s += 14;
  if (t.location === "underground" || t.layer === "-1" || t.level === "-1" || t.floating === "yes" || t.building === "roof") s += 12;
  if (t.historic || t.heritage) s += 4;
  // les restaurants très documentés (étoilés, Wikipedia) sont connus de tout le monde : pas « cachés »
  if (t.wikipedia || t.stars || Object.keys(t).some((k) => /^award:|^michelin/.test(k))) return -100;
  if (GENERIC_RE.test((t.name || "").trim())) s -= 15;
  if ((t.name || "").length < 4) s -= 15;
  return s;
}

async function query(c) {
  const q = `[out:json][timeout:120];(nwr["amenity"="restaurant"]["name"](around:${c.km * 1000},${c.lat},${c.lng}););out center tags;`;
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

function analyse(els, MAXN) {
  MAXN = MAXN || MAX;
  const stats = { total: 0, cuisine: 0, website: 0, hours: 0, chains: 0, desc: 0, wikidata: 0, kept: 0 };
  const seen = new Set(), cands = [];
  for (const e of els) {
    const t = e.tags || {}, lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon);
    if (!t.name || !lat || !lng) continue;
    stats.total++;
    if (cuisineOf(t)) stats.cuisine++;
    if (t.website || t["contact:website"]) stats.website++;
    if (t.opening_hours) stats.hours++;
    if (t.description || t["description:fr"]) stats.desc++;
    if (t.wikidata) stats.wikidata++;
    if (isChain(t)) { stats.chains++; continue; }
    const key = t.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    const sc = score(t);
    if (sc < MIN_SCORE) continue;
    seen.add(key);
    const addr = [t["addr:housenumber"], t["addr:street"], t["addr:city"]].filter(Boolean).join(" ");
    cands.push({
      id: "osm-" + e.type + "-" + e.id, title: t.name.trim(), lat: +lat.toFixed(6), lng: +lng.toFixed(6),
      cuisine: cuisineOf(t), tags: features(t), hours: t.opening_hours || "", address: addr,
      website: t.website || t["contact:website"] || "", description: t["description:fr"] || t.description || "",
      wikidata: t.wikidata || "", score: Math.round(sc),
    });
  }
  cands.sort((a, b) => b.score - a.score);
  // variété : 4 restaurants maximum par type de cuisine
  const count = {}, rows = [];
  for (const r of cands) {
    const k = r.cuisine || "?";
    if ((count[k] = (count[k] || 0) + 1) > Math.max(4, Math.round(MAXN / 8))) continue;
    rows.push(r);
    if (rows.length >= MAXN) break;
  }
  stats.kept = rows.length;
  return { rows, stats };
}

const pct = (n, d) => (d ? Math.round((100 * n) / d) + " %" : "-");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const lines = ["ESSAI « Restaurants à découvrir » (OpenStreetMap) — aucun effet sur le site", ""];
  for (const c of CITIES) {
    try {
      const { rows, stats } = analyse(await query(c), c.max);
      if (rows.length) fs.writeFileSync(path.join(OUT, c.key + ".json"), JSON.stringify(rows, null, 1));
      lines.push("=== " + c.name + " (rayon " + c.km + " km) ===");
      lines.push("Restaurants avec un nom : " + stats.total + " | chaînes écartées : " + stats.chains + " | retenus : " + stats.kept);
      lines.push("Renseignés : type de cuisine " + pct(stats.cuisine, stats.total) + ", site web " + pct(stats.website, stats.total) + ", horaires " + pct(stats.hours, stats.total) + ", description " + pct(stats.desc, stats.total) + ", fiche Wikidata " + pct(stats.wikidata, stats.total));
      rows.slice(0, 15).forEach((r) => lines.push("  - " + r.title + " [" + (r.cuisine || "cuisine non précisée") + (r.tags.length ? " · " + r.tags.join("/") : "") + "] score " + r.score));
      lines.push("");
    } catch (e) { lines.push("=== " + c.name + " === ERREUR " + e.message, ""); }
    await new Promise((r) => setTimeout(r, 3000));
  }
  fs.writeFileSync(path.join(OUT, "_resume.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { analyse, score, isChain, cuisineOf };
