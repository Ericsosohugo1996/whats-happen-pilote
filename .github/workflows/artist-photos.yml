// Photos d'artistes pour les concerts sans affiche (Wikipédia, licences libres).
// On ne garde la photo que si la page Wikipédia porte EXACTEMENT le nom de l'artiste et parle d'un musicien / groupe / humoriste.
// Écrit artist-photos.json ; split-data.js s'en sert ensuite. Lancé à la main par le robot « Photos des artistes ».
const fs = require("fs");
const path = require("path");
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos des artistes)";
const MAX_NEW = 3000;
const T0 = Date.now();
const TIME_UP = () => Date.now() - T0 > 17 * 60 * 1000;
const fold = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const REJECT = /soiree|festival|\bfest\b|quiz|atelier|\bjam\b|scene ouverte|open mic|karaoke|\bbal\b|brunch|apero|marche|\bdj\b|\bnuit\b|party|\bnight\b|session|hommage|tribute|\bcover\b|special|gratuit|inscription|stage|cours de|spectacle|concert de|conference|exposition|repas|d[eé]gustation|projection|\bcine|ciné|messe|chorale|orchestre de|ensemble |compagnie|th[eé][aâ]tre|vide.?grenier|loto|tournoi|match|l'heure|les [a-z]+ de /i;

// nom d'artiste « propre » tiré d'un titre d'événement, ou "" si le titre ne ressemble pas à un artiste
function artistName(title) {
  let t = String(title || "").replace(/\[[^\]]*\]|\([^)]*\)/g, " ");
  t = t.replace(/^\s*(concert|live|showcase|release party)\s*[:\-–]\s*/i, "");
  t = t.split(/\s+(?:\+|x|feat\.?|ft\.?|avec|&|\/|-|–|—|:|en concert|live|tour)\s+/i)[0];
  t = t.replace(/\s+(en concert|live|tour.*|\d{4}.*)$/i, "").replace(/\s+/g, " ").trim();
  if (t.length < 3 || t.length > 40) return "";
  if (/\d/.test(t)) return "";
  if (REJECT.test(fold(t))) return "";
  if (t.split(" ").length > 4) return "";
  return t;
}
function artistKey(title) { const n = artistName(title); return n ? fold(n).replace(/[^a-z0-9]+/g, " ").trim() : ""; }

const MUSIC_WORD = /groupe|chanteu|musicien|rappeu|duo\b|trio\b|quatuor|band\b|singer|rapper|musician|\bdj\b|producteu|compositeu|pianiste|guitariste|violoniste|saxophoniste|batteur|bassiste|auteur-compositeur|interpr[eè]te|humoriste|com[eé]dien|duo musical|collectif musical|artiste|songwriter|comedian|vocalist/;
const BAD_IMG = /logo|blason|armoiries|drapeau|flag|\.svg|\.png/i;
async function wiki(lang, name) {
  const url = "https://" + lang + ".wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=" + encodeURIComponent(name) +
    "&prop=pageimages%7Cextracts&piprop=thumbnail&pithumbsize=900&exintro=1&explaintext=1&exchars=420";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const p = Object.values((j.query && j.query.pages) || {})[0];
  if (!p || p.missing !== undefined || !p.thumbnail || !p.thumbnail.source) return null;
  const ext = fold(p.extract || "");
  if (/peut designer|may refer to|homonymie/.test(ext.slice(0, 200))) return null;
  if (!MUSIC_WORD.test(ext.slice(0, 300))) return null;
  if (fold(String(p.title).replace(/\s*\(.*\)\s*$/, "")).replace(/[^a-z0-9]+/g, " ").trim() !== fold(name).replace(/[^a-z0-9]+/g, " ").trim()) return null;
  if (BAD_IMG.test(p.thumbnail.source)) return null;
  if (p.thumbnail.width && p.thumbnail.width < 400) return null;
  return { u: p.thumbnail.source, t: p.title, c: "Photo de l'artiste · Wikipédia" };
}
async function lookup(name) { return (await wiki("fr", name)) || (await wiki("en", name)); }

async function main() {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync("artist-photos.json", "utf8")); } catch (e) {}
  if (cache._v !== 1) cache = { _v: 1 };
  const count = {};
  for (const f of fs.readdirSync("data/events")) {
    if (!f.endsWith(".json") || f.endsWith(".soon.json")) continue;
    let d = []; try { d = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
    for (const ev of d) {
      if (ev.category !== "Musique" && ev.category !== "Soirée") continue;
      if (ev.photo && !ev.photoGeneric && !ev.photoVenue && !ev.photoArtist) continue; // vraie affiche
      const n = artistName(ev.title); if (!n) continue;
      const k = artistKey(ev.title); if (!k || k in cache) continue;
      (count[k] = count[k] || { n: 0, name: n }).n++;
    }
  }
  const todo = Object.entries(count).sort((a, b) => b[1].n - a[1].n).slice(0, MAX_NEW);
  console.log("artistes à chercher :", todo.length, "(déjà en mémoire :", Object.keys(cache).length - 1 + ")");
  let found = 0, tried = 0;
  for (const [k, v] of todo) {
    if (TIME_UP()) { console.log("temps presque écoulé : on enregistre et on s'arrête (relance pour continuer)"); break; }
    tried++;
    try { const r = await lookup(v.name); cache[k] = r; if (r) found++; }
    catch (e) { console.log("échec", v.name, e.message); await new Promise((r) => setTimeout(r, 1500)); }
    await new Promise((r) => setTimeout(r, 150));
    if (tried % 200 === 0) console.log("…", tried, "cherchés,", found, "trouvés");
  }
  const total = Object.entries(cache).filter(([k, v]) => k !== "_v" && v).length;
  console.log("terminé :", tried, "artistes cherchés,", found, "photos trouvées, total en mémoire :", total);
  console.log("exemples :\n" + Object.entries(cache).filter(([k, v]) => k !== "_v" && v).slice(-15).map(([k, v]) => k + " → " + v.t).join("\n"));
  fs.writeFileSync("artist-photos.json", JSON.stringify(cache));
}
module.exports = { artistKey, artistName };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
