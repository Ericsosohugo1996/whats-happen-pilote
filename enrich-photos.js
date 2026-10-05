// Cherche une photo libre de droit (Wikipédia / Wikimedia Commons) pour chaque lieu de datatourisme-places.json.
// Pour chaque lieu : on demande à Wikipédia les articles situés à moins de 300 m, puis on garde celui dont le
// NOM ressemble à celui du lieu ET qui a une image. Si rien ne correspond, on ne met pas de photo (jamais la mauvaise).
// Le résultat est mémorisé dans photos-cache.json (un lieu déjà traité n'est pas redemandé).
// Lancé par le robot GitHub .github/workflows/place-photos.yml
const fs = require("fs");

const PLACES = "datatourisme-places.json";
const CACHE = "photos-cache.json";
const API = process.env.WIKI_API || "https://fr.wikipedia.org/w/api.php";
const MAX_PER_RUN = parseInt(process.env.MAX_PER_RUN || "6000", 10);
const CONCURRENCY = 5;
const RADIUS_M = 300;
const RETRY_MISS_DAYS = 90;
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos de lieux)";

const STOP = new Set(("le la les un une des du de d l et en au aux sur sous dans pour par chez ses son sa leur " +
  "musee museum chateau eglise cathedrale basilique chapelle theatre palais domaine site jardin parc maison hotel " +
  "salle espace centre national nationale departemental municipal saint sainte st ste notre dame the of and").split(" "));

function tokens(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
}
function nameMatches(placeTitle, articleTitle) {
  const p = tokens(placeTitle), a = tokens(articleTitle);
  if (!p.length || !a.length) return false;
  const aset = new Set(a);
  let overlap = 0;
  for (const w of new Set(p)) if (aset.has(w)) overlap++;
  return overlap >= Math.max(1, Math.ceil(Math.min(new Set(p).size, aset.size) * 0.6));
}
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const BAD_IMG = /logo|blason|armoiries|drapeau|flag|carte|map|plan[_-]|locator|icon|\.svg/i;

async function wikiGeo(lat, lng) {
  const url = API + "?action=query&format=json&formatversion=2&generator=geosearch&ggsnamespace=0" +
    "&ggscoord=" + encodeURIComponent(lat + "|" + lng) + "&ggsradius=" + RADIUS_M + "&ggslimit=10" +
    "&prop=pageimages|coordinates&piprop=thumbnail&pithumbsize=640&pilimit=10&colimit=10";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
      if (r.status === 429 || r.status >= 500) throw new Error("HTTP " + r.status);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      return (j.query && j.query.pages) || [];
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
    }
  }
}

function pickPhoto(place, pages) {
  let best = null;
  for (const pg of pages) {
    if (!pg.thumbnail || !pg.thumbnail.source || BAD_IMG.test(pg.thumbnail.source)) continue;
    const c = pg.coordinates && pg.coordinates[0];
    if (!c) continue;
    const d = haversineM(place.lat, place.lng, c.lat, c.lon);
    if (d > RADIUS_M) continue;
    if (!nameMatches(place.title, pg.title)) continue;
    if (!best || d < best.d) best = { d, u: pg.thumbnail.source, w: pg.title };
  }
  return best ? { u: best.u, w: best.w } : null;
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8"));
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  const today = Math.floor(Date.now() / 86400000);
  const todo = places.filter((p) => {
    if (!p.id || !isFinite(p.lat) || !isFinite(p.lng) || !p.title) return false;
    const c = cache[p.id];
    if (!c) return true;
    return c.n && today - c.t > RETRY_MISS_DAYS;
  }).slice(0, MAX_PER_RUN);
  console.log("lieux :", places.length, "| à traiter dans ce passage :", todo.length);

  let done = 0, found = 0, failed = 0, consecutiveFail = 0, i = 0;
  const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));
  async function worker() {
    while (i < todo.length && consecutiveFail < 40) {
      const p = todo[i++];
      try {
        const pages = await wikiGeo(p.lat, p.lng);
        const hit = pickPhoto(p, pages);
        cache[p.id] = hit ? hit : { n: 1, t: today };
        if (hit) found++;
        consecutiveFail = 0;
      } catch (e) {
        failed++; consecutiveFail++;
      }
      done++;
      if (done % 500 === 0) { save(); console.log(done + "/" + todo.length, "photos trouvées :", found); }
      await new Promise((res) => setTimeout(res, 60));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log("terminé :", done, "traités,", found, "photos trouvées,", failed, "échecs réseau");
  if (consecutiveFail >= 40) console.log("arrêt anticipé (trop d'échecs de suite) : le reste sera repris au prochain passage");
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { nameMatches, pickPhoto, tokens };
