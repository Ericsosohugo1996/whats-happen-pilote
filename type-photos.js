// Photos d'illustration par type de lieu (théâtre, musée, église…), pour les lieux qui n'ont pas
// leur propre photo. Cherche de belles photos libres sur Wikimedia Commons (images "mises en
// avant" ou "de qualité") et écrit type-photos.json. split-data.js s'en sert ensuite.
// Lancé à la main par le robot "Photos d'illustration" (.github/workflows/type-photos.yml).
const fs = require("fs");

const API = process.env.WIKI_API_COMMONS || "https://commons.wikimedia.org/w/api.php";
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos d'illustration)";
const PER_TYPE = 6;

// requêtes de recherche par type (les premières sont les plus précises)
const QUERIES = {
  theatre: ["theatre auditorium", "theatre interior stage", "opera house interior"],
  musee: ["museum interior gallery", "museum facade", "museum hall exhibition"],
  eglise: ["church facade france", "cathedral exterior", "chapel church"],
  chateau: ["chateau france", "castle france", "castle tower"],
  jardin: ["garden park france", "park pond trees", "formal garden"],
  cinema: ["cinema auditorium", "movie theatre interior", "cinema"],
  livre: ["bookshop interior", "library reading room", "bookstore"],
  galerie: ["art gallery exhibition", "gallery exhibition paintings", "contemporary art exhibition"],
  monument: ["monument france", "triumphal arch", "historic monument square"],
};
const BAD_TITLE = /(map|plan|diagram|logo|drawing|painting|poster|screenshot|stamp|coat of arms|flag|schema|floor ?plan|interior of a mosque|statue of|portrait|crowd|protest|night shot of a car)/i;

function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

// type d'un lieu d'après son nom (même logique que les illustrations de l'appli)
function placeType(title) {
  const t = norm(title);
  if (/\b(theatre|comedie|opera|cirque|marionnette|marionnettes|bouffes|folies|olympia)\b/.test(t)) return "theatre";
  if (/\b(cinema|cine)\b/.test(t)) return "cinema";
  if (/\b(eglise|cathedrale|chapelle|basilique|abbaye|temple|synagogue|mosquee|collegiale|prieure|notre-dame|saint-)/.test(t)) return "eglise";
  if (/\b(librairie|bibliotheque|mediatheque)\b/.test(t)) return "livre";
  if (/\b(chateau|forteresse|citadelle|donjon|manoir|fort)\b/.test(t)) return "chateau";
  if (/\b(jardin|jardins|parc|square|foret|bois|lac|plage|gorges|cascade|grotte|reserve|sentier|jardinet)\b/.test(t)) return "jardin";
  if (/\b(galerie|atelier|centre d'art|fondation|exposition|salon)\b/.test(t)) return "galerie";
  if (/\b(musee|museum|maison|ecomusee|collection|palais)\b/.test(t)) return "musee";
  if (/\b(pont|tour|arc|porte|monument|statue|colonne|obelisque|memorial|fontaine|halles|moulin|phare|hotel)\b/.test(t)) return "monument";
  return "musee";
}

function hash(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

// photo d'illustration choisie pour un lieu (stable : toujours la même pour un même lieu)
function pickFor(ev, typePhotos) {
  const list = typePhotos && typePhotos[placeType(ev.title)];
  if (!list || !list.length) return null;
  return list[hash(ev.id) % list.length];
}

function plain(s) { return String(s || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }

async function search(q, cat) {
  const url = API + "?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=40" +
    "&gsrsearch=" + encodeURIComponent(q + ' filetype:bitmap incategory:"' + cat + '"') +
    "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=900";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !ii.thumburl || ii.mime !== "image/jpeg") continue;
    const ratio = ii.width / ii.height;
    if (ii.width < 1400 || ratio < 1.25 || ratio > 2.2) continue;
    if (BAD_TITLE.test(p.title)) continue;
    const md = ii.extmetadata || {};
    const artist = plain(md.Artist && md.Artist.value).slice(0, 40);
    const lic = plain(md.LicenseShortName && md.LicenseShortName.value).slice(0, 20);
    out.push({ u: ii.thumburl, t: p.title.replace(/^File:/, ""), c: "Illustration" + (artist ? " · " + artist : "") + (lic ? ", " + lic : " · Wikimedia Commons") });
  }
  return out;
}

async function main() {
  const out = {};
  for (const [type, queries] of Object.entries(QUERIES)) {
    const got = [];
    const seen = new Set();
    for (const cat of ["Featured pictures on Wikimedia Commons", "Quality images"]) {
      for (const q of queries) {
        if (got.length >= PER_TYPE) break;
        try {
          for (const c of await search(q, cat)) {
            if (!seen.has(c.u) && got.length < PER_TYPE) { seen.add(c.u); got.push(c); }
          }
        } catch (e) { console.log("échec", type, q, e.message); }
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    out[type] = got;
    console.log(type, ":", got.length, "photos");
  }
  fs.writeFileSync("type-photos.json", JSON.stringify(out, null, 1));
  console.log("type-photos.json écrit");
}

module.exports = { placeType, pickFor };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

