// Whazup — photos des bars « à ne pas manquer » : pour chaque bar retenu (data/bars-plus/<ville>.json) qui n'a pas de photo,
// cherche sur Wikimedia Commons une photo géolocalisée à moins de 80 m, gardée SEULEMENT si le nom du fichier contient tous les mots
// du nom du bar et si la licence est libre (CC BY, CC BY-SA, CC0, domaine public). Sinon : pas de photo (l'appli garde son illustration).
// Les réponses (y compris « rien trouvé ») sont mémorisées dans data/bars-plus/_photos-cache.json pour ne pas refaire les mêmes requêtes.
// Pour tout retirer : supprimer ce fichier et son workflow ; les photos ajoutées disparaissent en relançant bars-sympa.js.
const fs = require("fs");
const path = require("path");

const DIR = path.join("data", "bars-plus");
const CACHE = path.join(DIR, "_photos-cache.json");
const PER_CITY = 15;
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos des bars)";
const T0 = Date.now();
const TIME_UP = () => Date.now() - T0 > 100 * 60 * 1000;
const STOP = new Set(["le", "la", "les", "de", "du", "des", "et", "au", "aux", "l", "d", "en", "sur", "a", "the", "chez", "bar", "pub", "cafe"]);
const fold = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(DIR)) { console.log("data/bars-plus absent : lancer d'abord « Bars à ne pas manquer »."); return; }
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  const names = {};
  try {
    const app = fs.readFileSync("app.js", "utf8");
    const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)"/gm; let m;
    while ((m = re.exec(app))) names[m[1]] = m[2];
  } catch (e) {}
  let found = 0, tried = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json") && !x.startsWith("_"))) {
    if (TIME_UP()) { console.log("Temps écoulé : on reprendra au prochain passage."); break; }
    const key = f.replace(".json", "");
    const p = path.join(DIR, f);
    const rows = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;
    for (const r of rows.slice(0, PER_CITY)) {
      if (r.photo) { if (!r.photoCredit) { r.photoCredit = "Wikimedia Commons"; changed = true; } continue; }
      const ck = r.id;
      if (cache[ck] === undefined) {
        tried++;
        try { cache[ck] = (await commonsLookup(r.title, r.lat, r.lng, names[key] || key)) || 0; }
        catch (e) { console.log(key, r.title, e.message); await sleep(3000); continue; }
        await sleep(400);
      }
      if (cache[ck]) { r.photo = cache[ck].u; r.photoCredit = cache[ck].c; found++; changed = true; }
    }
    if (changed) fs.writeFileSync(p, JSON.stringify(rows));
    fs.writeFileSync(CACHE, JSON.stringify(cache));
  }
  const line = "Photos de bars : " + found + " ajoutées (" + tried + " recherches)";
  console.log(line);
  fs.writeFileSync(path.join(DIR, "_photos-resume.txt"), line + "\n");
}
main().catch((e) => { console.error(e); process.exit(1); });
