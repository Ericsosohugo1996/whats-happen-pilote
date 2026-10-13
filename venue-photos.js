// Photos réelles des salles de spectacle, théâtres, clubs… (Wikipédia, licences libres).
// Pour chaque lieu qui revient souvent dans nos événements et n'a qu'une photo générique,
// on cherche la page Wikipédia du lieu et on garde sa photo SEULEMENT si le nom correspond bien.
// Écrit venue-photos.json ; split-data.js s'en sert ensuite. Lancé à la main par le robot « Photos des salles ».
const fs = require("fs");
const path = require("path");

const API = "https://fr.wikipedia.org/w/api.php";
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos des salles)";
const MAX_NEW = 1500;
const CACHE_VERSION = 2; // version 2 : contrôle de la ville obligatoire (les anciennes réponses sont refaites)
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
    if (inTitle || inText) {
      if (p.thumbnail.width && p.thumbnail.width < 500) continue;
      return { u: p.thumbnail.source, t: p.title, c: "Photo du lieu · Wikipédia" };
    }
  }
  return null;
}

async function main() {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync("venue-photos.json", "utf8")); } catch (e) {}
  if (cache._v !== CACHE_VERSION) { console.log("ancienne mémoire ignorée (version", cache._v, ")"); cache = { _v: CACHE_VERSION }; }
  const names = cityNames();
  const count = {};
  for (const f of fs.readdirSync("data/events")) {
    if (!f.endsWith(".json") || f.endsWith(".soon.json")) continue;
    let d = []; try { d = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
    for (const ev of d) {
      if (!["Spectacles", "Musique", "Soirée", "Sport", "Famille"].includes(ev.category)) continue;
      if (ev.photo && !ev.photoGeneric) continue; // il a déjà une vraie photo
      const n = venueName(ev.place); if (!n) continue;
      const k = venueKey(ev.place, ev.city);
      if (k in cache) continue;
      (count[k] = count[k] || { n: 0, name: n, city: ev.city }).n++;
    }
  }
  const todo = Object.entries(count).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  console.log("lieux à chercher :", todo.length, "(déjà en mémoire :", Object.keys(cache).length - 1 + ")");
  let found = 0, tried = 0;
  for (const [k, v] of todo) {
    tried++;
    try {
      const r = await lookup(v.name, names[v.city] || v.city);
      cache[k] = r; if (r) found++;
    } catch (e) { console.log("échec", v.name, e.message); await new Promise((r) => setTimeout(r, 1500)); }
    await new Promise((r) => setTimeout(r, 200));
    if (tried % 100 === 0) console.log("…", tried, "cherchés,", found, "trouvés");
  }
  const total = Object.entries(cache).filter(([k, v]) => k !== "_v" && v).length;
  console.log("terminé :", tried, "lieux cherchés,", found, "photos trouvées, total en mémoire :", total);
  const ex = Object.entries(cache).filter(([k, v]) => k !== "_v" && v).slice(-12).map(([k, v]) => k + " → " + v.t);
  console.log("exemples :\n" + ex.join("\n"));
  fs.writeFileSync("venue-photos.json", JSON.stringify(cache));
}
module.exports = { venueKey, venueName };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
