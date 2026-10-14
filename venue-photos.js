// Photos réelles des salles de spectacle, théâtres, clubs… (Wikipédia, licences libres).
// Pour chaque lieu qui revient souvent dans nos événements et n'a qu'une photo générique,
// on cherche la page Wikipédia du lieu et on garde sa photo SEULEMENT si le nom correspond bien.
// Écrit venue-photos.json ; split-data.js s'en sert ensuite. Lancé à la main par le robot « Photos des salles ».
const fs = require("fs");
const path = require("path");

const API = "https://fr.wikipedia.org/w/api.php";
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos des salles)";
const MAX_NEW = 1500;
const T0 = Date.now();
const TIME_UP = () => Date.now() - T0 > 17 * 60 * 1000; // on s'arrête avant la limite du robot (25 min) pour ne rien perdre
const CACHE_VERSION = 3; // version 2 : contrôle de la ville obligatoire (les anciennes réponses sont refaites)
const STOP = new Set(["le", "la", "les", "de", "du", "des", "et", "au", "aux", "l", "d", "en", "sur", "a", "the", "salle", "espace", "centre"]);

const fold = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// nom du lieu nettoyé (sans numéro de rue, sans « Rue de… » seule)
function venueName(place) {
  let n = String(place || "").split(",")[0].trim();
  n = n.replace(/^\d+\s*(bis|ter)?\s*(rue|avenue|av\.?|boulevard|bd|place|chemin|route|impasse|allee|quai|cours)\b[^A-Za-zÀ-ÿ]*[a-zà-ÿ' -]*?\s+(?=[A-ZÀ-Ý])/i, "");
  n = n.replace(/^(lieu-dit|lieu dit)\s+/i, "");
  n = n.replace(/\s+/g, " ").trim();
  if (n.length < 4 || n.length > 70) return "";
  if (/^\d/.test(n)) return "";
  if (/^(rue|avenue|boulevard|place|chemin|route|impasse|allee|quai|cours|zone|zac|parking|esplanade|parvis|salle des f[eê]tes|mairie|[eé]glise|gymnase)\b/i.test(fold(n))) return "";
  return n;
}
function venueKey(place, city) { return fold(venueName(place)).replace(/[^a-z0-9]+/g, " ").trim() + "|" + city; }

function cityNames() {
  const out = {};
  try {
    const src = fs.readFileSync("app.js", "utf8");
    const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
    const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)"/gm; let m;
    while ((m = re.exec(src.slice(start, end)))) out[m[1]] = m[2];
  } catch (e) {}
  return out;
}

const VENUE_WORD = /th[eé][aâ]tre|salle|op[eé]ra|z[eé]nith|cirque|caf[eé]|club|sc[eè]ne|music|stade|arena|festival|complexe|auditorium|cin[eé]ma|palais|com[eé]die|spectacle|concert|bar\b|bo[iî]te|cabaret|casino|olympia|bataclan|halle|mus[eé]e|museum|ch[aâ]teau|abbaye|m[eé]diath[eè]que|biblioth[eè]que|galerie|cath[eé]drale|basilique|fondation|domaine|citadelle|fort\b/;
const BAD_IMG = /logo|blason|armoiries|drapeau|flag|plan_|carte|map|\.svg/i;

async function lookup(name, cityName) {
  const q = name + " " + cityName;
  const url = API + "?action=query&format=json&generator=search&gsrlimit=4&gsrnamespace=0&gsrsearch=" + encodeURIComponent(q) +
    "&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=1000&exintro=1&explaintext=1&exchars=500&exlimit=4";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const sig = fold(name).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (!sig.length) return null;
  const cn = fold(cityName);
  for (const p of pages) {
    if (!p.thumbnail || !p.thumbnail.source || BAD_IMG.test(p.thumbnail.source)) continue;
    const title = fold(p.title), ext = fold(p.extract || "");
    if (/est une commune|est une ville|est un departement|est un homme|est une femme|\(\d{4}-\d{4}\)|\bne le\b|\bnee le\b|\bne en\b/.test(ext.slice(0, 160))) continue;
    if (/^siege|bataille|histoire|liste |^communaute|^arrondissement|^canton/.test(title)) continue;
    if (!VENUE_WORD.test(title + " " + ext.slice(0, 200))) continue;
    // la ville doit apparaître dans la page (titre ou résumé) : évite les homonymes d'une autre ville
    if (!(title.includes(cn) || ext.includes(cn))) continue;
    const inTitle = sig.every((w) => title.includes(w));
    const inText = sig.every((w) => (title + " " + ext).includes(w));
    const shares = sig.some((w) => title.includes(w)); // le titre de la page doit partager au moins un mot du nom du lieu
    if (shares && (inTitle || inText)) {
      if (p.thumbnail.width && p.thumbnail.width < 500) continue;
      return { u: p.thumbnail.source, t: p.title, c: "Photo du lieu · Wikipédia" };
    }
  }
  return null;
}


// 2e source : Wikimedia Commons, photos géolocalisées à moins de 80 m du lieu, gardées SEULEMENT si le nom du fichier contient un mot du nom du lieu.
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const BAD_FILE = /logo|blason|armoiries|drapeau|flag|plan[ _-]|carte|map|affiche|poster|programme|ticket|billet|\.svg|\.pdf|\.tif|\.gif|\.webm|\.ogv|portrait|concert de|interieur|plaque/i;
const LIC_OK = /^(cc[ -]by|cc0|public domain|pd|attribution|domaine public)/i;
const GENERIC = new Set(["saint", "sainte", "place", "rue", "avenue", "boulevard", "quai", "cours", "port", "pont", "gare", "paris", "ville", "grand", "grande", "petit", "petite", "nouveau", "nouvelle", "vieux", "vieille"]);
const WEAK = new Set(["theatre", "opera", "salle", "cafe", "casino", "cinema", "auditorium", "complexe", "espace", "palais", "scene", "club", "bar", "comedie", "music", "hall", "halle", "stade", "arena", "zenith"]);
const BAD_TITLE2 = /\b(rue|boulevard|avenue|gare|pont|inscription|manif|manifestation|panneau|plaque|bus|tram|metro|station|parking|voiture|travail|greve|marche|place|places|fontaine|virgin|vierge|madonna|tableau|retable|painting|statue|sculpture|panel|wood|paint|painting|christ|jesus|polished|gold|oil|portrait|square|jardin|garden|park|parc|village|panorama|vue)\b/;
const VENUE_IN_TITLE = /(theatre|salle|opera|arena|zenith|palais|casino|cinema|auditorium|scene|club|halle|stade|kursaal|abbaye|chateau|musee|eglise|chapelle|cathedrale|basilique|mediatheque|bibliotheque|galerie|concert|live|tour|facade|interieur|bar|cafe|orange|boule|bain)/;
async function commonsLookup(name, lat, lng, cityName) {
  const url = COMMONS + "?action=query&format=json&generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=80&ggslimit=30&ggscoord=" +
    lat + "%7C" + lng + "&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1000";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const files = Object.values((j.query && j.query.pages) || {});
  const cn = fold(cityName || "").split(/[^a-z0-9]+/).filter(Boolean);
  // mots qui identifient vraiment le lieu : ni la ville, ni les mots trop courants (saint, rue, place…)
  const sig = fold(name).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w) && !GENERIC.has(w) && cn.indexOf(w) === -1);
  const strong = sig.filter((w) => !WEAK.has(w));
  if (!sig.length || !strong.length) return null; // un nom fait seulement de mots génériques (« Théâtre municipal ») : on ne devine pas
  let best = null;
  for (const p of files) {
    const ii = p.imageinfo && p.imageinfo[0]; if (!ii) continue;
    const title = fold((p.title || "").replace(/^File:/i, ""));
    if (BAD_FILE.test(title) || BAD_TITLE2.test(title)) continue;
    if (!/image\/jpeg/.test(ii.mime || "")) continue;
    if ((ii.width || 0) < 800 || (ii.width || 0) < (ii.height || 0) * 0.9) continue; // paysage seulement
    const lic = ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value;
    if (!lic || !LIC_OK.test(lic)) continue;
    if (sig.length < 2 && !VENUE_IN_TITLE.test(title) && !VENUE_IN_TITLE.test(fold(name))) continue; // un seul mot (« Ferrenbach ») sans mot de salle : souvent un village ou une rue
    if (!sig.every((w) => title.includes(w))) continue; // TOUS les mots du nom du lieu doivent être dans le nom du fichier
    const score = (ii.width || 0) / 100;
    if (!best || score > best.score) {
      const artist = ((ii.extmetadata.Artist && ii.extmetadata.Artist.value) || "").replace(/<[^>]*>/g, "").trim().slice(0, 40);
      best = { score, r: { u: ii.thumburl || ii.url, t: String(p.title).replace(/^File:/i, ""), c: "Photo du lieu · " + (artist ? artist + ", " : "") + lic + " · Wikimedia Commons", s: "commons" } };
    }
  }
  return best ? best.r : null;
}


// ---- passe 3 : Wikidata (élément du lieu avec une photo P18 sur Commons, à moins de 200 m, nom identique) ----
const WDQS = process.env.WDQS_API || "https://query.wikidata.org/sparql";
async function wikidataLookup(name, lat, lng, cityName) {
  const cn = fold(cityName || "").split(/[^a-z0-9]+/).filter(Boolean);
  const sig = fold(name).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w) && !GENERIC.has(w) && cn.indexOf(w) === -1);
  const strong = sig.filter((w) => !WEAK.has(w));
  if (!sig.length || !strong.length) return null;
  const q = 'SELECT ?itemLabel ?img WHERE { SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(' + lng + " " + lat + ')"^^geo:wktLiteral . bd:serviceParam wikibase:radius "0.2" } ?item wdt:P18 ?img . SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" } } LIMIT 15';
  const r = await fetch(WDQS + "?format=json&query=" + encodeURIComponent(q), { headers: { "User-Agent": UA, "Accept": "application/sparql-results+json" } });
  if (r.status === 429) { await new Promise((x) => setTimeout(x, 30000)); throw new Error("trop de demandes"); }
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  for (const b of (j.results && j.results.bindings) || []) {
    const label = fold(b.itemLabel && b.itemLabel.value);
    if (!label || BAD_TITLE2.test(label) || !sig.every((w) => label.includes(w))) continue;
    const file = decodeURIComponent(String(b.img.value).split("/").pop()).replace(/_/g, " ");
    const u = COMMONS + "?action=query&format=json&titles=" + encodeURIComponent("File:" + file) + "&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1000";
    const rr = await fetch(u, { headers: { "User-Agent": UA } }); if (!rr.ok) continue;
    const jj = await rr.json(); const p = Object.values((jj.query && jj.query.pages) || {})[0];
    const ii = p && p.imageinfo && p.imageinfo[0]; if (!ii) continue;
    const t = fold(file);
    if (BAD_FILE.test(t) || BAD_TITLE2.test(t) || !/image\/jpeg/.test(ii.mime || "")) continue;
    if ((ii.width || 0) < 800 || (ii.width || 0) < (ii.height || 0) * 0.9) continue;
    const lic = ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value;
    if (!lic || !LIC_OK.test(lic)) continue;
    const artist = ((ii.extmetadata.Artist && ii.extmetadata.Artist.value) || "").replace(/<[^>]*>/g, "").trim().slice(0, 40);
    return { u: ii.thumburl || ii.url, t: file, c: "Photo du lieu · " + (artist ? artist + ", " : "") + lic + " · Wikimedia Commons", s: "wikidata" };
  }
  return null;
}

async function main() {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync("venue-photos.json", "utf8")); } catch (e) {}
  if (cache._v !== CACHE_VERSION) { console.log("ancienne mémoire ignorée (version", cache._v, ")"); cache = { _v: CACHE_VERSION }; }
  const names = cityNames();
  const count = {}, all = {};
  for (const f of fs.readdirSync("data/events")) {
    if (!f.endsWith(".json") || f.endsWith(".soon.json")) continue;
    let d = []; try { d = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
    for (const ev of d) {
      if (!["Spectacles", "Musique", "Soirée", "Sport", "Famille", "Expo", "Festival"].includes(ev.category)) continue;
      if (ev.photo && !ev.photoGeneric && !ev.photoVenue) continue; // il a déjà une vraie affiche (une photo de salle trouvée avant ne compte pas : on la refait)
      const n = venueName(ev.place); if (!n) continue;
      const k = venueKey(ev.place, ev.city);
      const a = (all[k] = all[k] || { n: 0, name: n, city: ev.city, lat: null, lng: null }); a.n++;
      if (a.lat == null && typeof ev.lat === "number" && typeof ev.lng === "number") { a.lat = ev.lat; a.lng = ev.lng; }
      if (k in cache) continue;
      const o = (count[k] = count[k] || { n: 0, name: n, city: ev.city, lat: null, lng: null }); o.n++;
      if (o.lat == null && typeof ev.lat === "number" && typeof ev.lng === "number") { o.lat = ev.lat; o.lng = ev.lng; }
    }
  }
  const todo = Object.entries(count).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  console.log("lieux à chercher :", todo.length, "(déjà en mémoire :", Object.keys(cache).length - 1 + ")");
  let found = 0, tried = 0;
  for (const [k, v] of todo) {
    if (TIME_UP()) { console.log("temps presque écoulé : on enregistre et on s'arrête (relance pour continuer)"); break; }
    tried++;
    try {
      const r = await lookup(v.name, names[v.city] || v.city);
      cache[k] = r; if (r) found++;
    } catch (e) { console.log("échec", v.name, e.message); await new Promise((r) => setTimeout(r, 1500)); }
    await new Promise((r) => setTimeout(r, 200));
    if (tried % 100 === 0) console.log("…", tried, "cherchés,", found, "trouvés");
  }

  // ---- passe 2 : Wikimedia Commons pour les lieux sans photo ----
  if (cache._cv !== 4) { // règle plus stricte : on efface les anciennes photos Commons et on recommence
    let purged = 0;
    for (const k of Object.keys(cache)) { if (k !== "_v" && k !== "_c" && k !== "_w" && k !== "_cv" && cache[k] && cache[k].s === "commons") { cache[k] = null; purged++; } }
    cache._c = {}; cache._cv = 4; console.log("anciennes photos Commons effacées :", purged);
  }
  cache._c = cache._c || {};
  const todo2 = Object.entries(all).filter(([k, v]) => v.lat != null && !cache[k] && !(k in cache._c)).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  // les lieux déjà « null » en mémoire (pas dans count car déjà cherchés) : on les retrouve aussi
  console.log("passe 2 (Commons) :", todo2.length, "lieux");
  let found2 = 0, tried2 = 0;
  for (const [k, v] of todo2) {
    if (TIME_UP()) { console.log("temps presque écoulé : on enregistre et on s'arrête (relance pour continuer)"); break; }
    tried2++;
    try {
      const r = await commonsLookup(v.name, v.lat, v.lng, names[v.city] || v.city);
      cache._c[k] = r ? 1 : 0;
      if (r) { cache[k] = r; found2++; }
    } catch (e) { console.log("échec Commons", v.name, e.message); await new Promise((r) => setTimeout(r, 1500)); }
    await new Promise((r) => setTimeout(r, 250));
    if (tried2 % 100 === 0) console.log("… Commons", tried2, "cherchés,", found2, "trouvés");
  }
  console.log("passe 2 terminée :", tried2, "cherchés,", found2, "photos trouvées");

  // ---- passe 3 : Wikidata ----
  cache._w = cache._w || {};
  const todo3 = Object.entries(all).filter(([k, v]) => v.lat != null && !cache[k] && !(k in cache._w)).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  console.log("passe 3 (Wikidata) :", todo3.length, "lieux");
  let found3 = 0, tried3 = 0;
  for (const [k, v] of todo3) {
    if (TIME_UP()) { console.log("temps presque écoulé : on enregistre et on s'arrête (relance pour continuer)"); break; }
    tried3++;
    try {
      const r = await wikidataLookup(v.name, v.lat, v.lng, names[v.city] || v.city);
      cache._w[k] = r ? 1 : 0;
      if (r) { cache[k] = r; found3++; }
    } catch (e) { console.log("échec Wikidata", v.name, e.message); await new Promise((r) => setTimeout(r, 2000)); }
    await new Promise((r) => setTimeout(r, 1200));
    if (tried3 % 100 === 0) console.log("… Wikidata", tried3, "cherchés,", found3, "trouvés");
  }
  console.log("passe 3 terminée :", tried3, "cherchés,", found3, "photos trouvées");
  const total = Object.entries(cache).filter(([k, v]) => k !== "_v" && k !== "_c" && k !== "_w" && k !== "_cv" && v).length;
  console.log("terminé :", tried, "lieux cherchés,", found, "photos trouvées, total en mémoire :", total);
  const ex = Object.entries(cache).filter(([k, v]) => k !== "_v" && k !== "_c" && k !== "_w" && k !== "_cv" && v).slice(-12).map(([k, v]) => k + " → " + v.t);
  console.log("exemples :\n" + ex.join("\n"));
  fs.writeFileSync("venue-photos.json", JSON.stringify(cache));
}
module.exports = { venueKey, venueName, wikidataLookup };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
