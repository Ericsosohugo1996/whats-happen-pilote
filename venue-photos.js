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

const VENUE_WORD = /th[eé][aâ]tre|salle|op[eé]ra|z[eé]nith|cirque|caf[eé]|club|sc[eè]ne|music|stade|arena|festival|complexe|auditorium|cin[eé]ma|palais|com[eé]die|spectacle|concert|bar\b|bo[iî]te|cabaret|casino|olympia|bataclan|halle/;
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
async function commonsLookup(name, lat, lng) {
  const url = COMMONS + "?action=query&format=json&generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=80&ggslimit=30&ggscoord=" +
    lat + "%7C" + lng + "&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1000";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const files = Object.values((j.query && j.query.pages) || {});
  const sig = fold(name).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
  if (!sig.length) return null;
  let best = null;
  for (const p of files) {
    const ii = p.imageinfo && p.imageinfo[0]; if (!ii) continue;
    const title = fold((p.title || "").replace(/^File:/i, ""));
    if (BAD_FILE.test(title)) continue;
    if (!/image\/jpeg/.test(ii.mime || "")) continue;
    if ((ii.width || 0) < 800 || (ii.width || 0) < (ii.height || 0) * 0.9) continue; // paysage seulement
    const lic = ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value;
    if (!lic || !LIC_OK.test(lic)) continue;
    if (!sig.some((w) => title.includes(w))) continue;
    const score = sig.filter((w) => title.includes(w)).length * 10000 + (ii.width || 0) / 100;
    if (!best || score > best.score) {
      const artist = ((ii.extmetadata.Artist && ii.extmetadata.Artist.value) || "").replace(/<[^>]*>/g, "").trim().slice(0, 40);
      best = { score, r: { u: ii.thumburl || ii.url, t: String(p.title).replace(/^File:/i, ""), c: "Photo du lieu · " + (artist ? artist + ", " : "") + lic + " · Wikimedia Commons", s: "commons" } };
    }
  }
  return best ? best.r : null;
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
      if (!["Spectacles", "Musique", "Soirée", "Sport", "Famille"].includes(ev.category)) continue;
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
  cache._c = cache._c || {};
  const todo2 = Object.entries(all).filter(([k, v]) => v.lat != null && !cache[k] && !(k in cache._c)).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  // les lieux déjà « null » en mémoire (pas dans count car déjà cherchés) : on les retrouve aussi
  console.log("passe 2 (Commons) :", todo2.length, "lieux");
  let found2 = 0, tried2 = 0;
  for (const [k, v] of todo2) {
    if (TIME_UP()) { console.log("temps presque écoulé : on enregistre et on s'arrête (relance pour continuer)"); break; }
    tried2++;
    try {
      const r = await commonsLookup(v.name, v.lat, v.lng);
      cache._c[k] = r ? 1 : 0;
      if (r) { cache[k] = r; found2++; }
    } catch (e) { console.log("échec Commons", v.name, e.message); await new Promise((r) => setTimeout(r, 1500)); }
    await new Promise((r) => setTimeout(r, 250));
    if (tried2 % 100 === 0) console.log("… Commons", tried2, "cherchés,", found2, "trouvés");
  }
  console.log("passe 2 terminée :", tried2, "cherchés,", found2, "photos trouvées");
  const total = Object.entries(cache).filter(([k, v]) => k !== "_v" && k !== "_c" && v).length;
  console.log("terminé :", tried, "lieux cherchés,", found, "photos trouvées, total en mémoire :", total);
  const ex = Object.entries(cache).filter(([k, v]) => k !== "_v" && k !== "_c" && v).slice(-12).map(([k, v]) => k + " → " + v.t);
  console.log("exemples :\n" + ex.join("\n"));
  fs.writeFileSync("venue-photos.json", JSON.stringify(cache));
}
module.exports = { venueKey, venueName };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
