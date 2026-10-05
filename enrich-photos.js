// Cherche une photo libre de droit pour chaque lieu de datatourisme-places.json.
// Sources, dans l'ordre : Wikipédia française, Wikipédia anglaise, Wikimedia Commons (photos géolocalisées à moins de 100 m).
// Pour chaque source : on garde un résultat seulement si sa POSITION est proche ET si son NOM ressemble à celui du lieu
// (règles dans photo-match.js). Si rien ne correspond, on ne met pas de photo (jamais la mauvaise).
// Le résultat est mémorisé dans photos-cache.json (un lieu déjà traité n'est pas redemandé).
// Lancé par le robot GitHub .github/workflows/place-photos.yml
const fs = require("fs");
const { nameMatches } = require("./photo-match.js");

const PLACES = "datatourisme-places.json";
const CACHE = "photos-cache.json";
const WIKI_FR = process.env.WIKI_API || "https://fr.wikipedia.org/w/api.php";
const WIKI_EN = process.env.WIKI_API_EN || "https://en.wikipedia.org/w/api.php";
const COMMONS = process.env.WIKI_API_COMMONS || "https://commons.wikimedia.org/w/api.php";
const MAX_PER_RUN = parseInt(process.env.MAX_PER_RUN || "3500", 10);
const CONCURRENCY = 5;
const RADIUS_M = 300;
const COMMONS_RADIUS_M = 100;
const RETRY_MISS_DAYS = 90;
const CACHE_VERSION = 2; // 2 = toutes les sources (fr, en, commons) ont été essayées
const UA = "WhazupPhotoBot/1.0 (https://whazup.fr; photos de lieux)";

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const BAD_IMG = /logo|blason|armoiries|drapeau|flag|carte|map|plan[_-]|locator|icon|\.svg/i;
const BAD_FILE = /plaque|panneau|blason|logo|carte|\bmap\b|plan |schema|diagram|stele|affiche|poster|menu|signature|timbre|billet|gravure|tableau/i;

async function apiGet(base, params) {
  const url = base + "?" + params;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      return (j.query && j.query.pages) || [];
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
    }
  }
}

async function wikipedia(base, place, tag) {
  const pages = await apiGet(base, "action=query&format=json&formatversion=2&generator=geosearch&ggsnamespace=0" +
    "&ggscoord=" + encodeURIComponent(place.lat + "|" + place.lng) + "&ggsradius=" + RADIUS_M + "&ggslimit=10" +
    "&prop=pageimages|coordinates&piprop=thumbnail&pithumbsize=640&pilimit=10&colimit=10");
  let best = null;
  for (const pg of pages) {
    if (!pg.thumbnail || !pg.thumbnail.source || BAD_IMG.test(pg.thumbnail.source)) continue;
    const c = pg.coordinates && pg.coordinates[0];
    if (!c) continue;
    const d = haversineM(place.lat, place.lng, c.lat, c.lon);
    if (d > RADIUS_M || !nameMatches(place.title, pg.title)) continue;
    if (!best || d < best.d) best = { d, u: pg.thumbnail.source, w: pg.title, s: tag };
  }
  return best ? { u: best.u, w: best.w, s: best.s } : null;
}

async function commons(place) {
  const pages = await apiGet(COMMONS, "action=query&format=json&formatversion=2&generator=geosearch&ggsnamespace=6" +
    "&ggscoord=" + encodeURIComponent(place.lat + "|" + place.lng) + "&ggsradius=" + COMMONS_RADIUS_M + "&ggslimit=30" +
    "&prop=imageinfo|coordinates&iiprop=url|mime&iiurlwidth=640&colimit=30");
  let best = null;
  for (const pg of pages) {
    const ii = pg.imageinfo && pg.imageinfo[0];
    if (!ii || !ii.thumburl || ii.mime !== "image/jpeg") continue;
    const title = String(pg.title || "").replace(/^(File|Fichier):/i, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ");
    if (BAD_FILE.test(title) || BAD_IMG.test(ii.thumburl)) continue;
    const c = pg.coordinates && pg.coordinates[0];
    if (!c) continue;
    const d = haversineM(place.lat, place.lng, c.lat, c.lon);
    if (d > COMMONS_RADIUS_M || !nameMatches(place.title, title)) continue;
    if (!best || d < best.d) best = { d, u: ii.thumburl, w: title, s: "c" };
  }
  return best ? { u: best.u, w: best.w, s: best.s } : null;
}

async function findPhoto(place, stages) {
  for (const st of stages) {
    const hit = st === "fr" ? await wikipedia(WIKI_FR, place, "fr")
      : st === "en" ? await wikipedia(WIKI_EN, place, "en")
      : await commons(place);
    if (hit) return hit;
  }
  return null;
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8"));
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  const today = Math.floor(Date.now() / 86400000);
  const jobs = [];
  for (const p of places) {
    if (!p.id || !isFinite(p.lat) || !isFinite(p.lng) || !p.title) continue;
    const c = cache[p.id];
    if (!c) jobs.push({ p, stages: ["fr", "en", "commons"] });
    else if (c.n && !c.v) jobs.push({ p, stages: ["en", "commons"] }); // déjà essayé en français : on ajoute les nouvelles sources
    else if (c.n && today - c.t > RETRY_MISS_DAYS) jobs.push({ p, stages: ["fr", "en", "commons"] });
  }
  const todo = jobs.slice(0, MAX_PER_RUN);
  console.log("lieux :", places.length, "| à traiter dans ce passage :", todo.length, "sur", jobs.length, "en attente");

  let done = 0, found = 0, failed = 0, consecutiveFail = 0, i = 0;
  const bySource = {};
  const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));
  async function worker() {
    while (i < todo.length && consecutiveFail < 40) {
      const { p, stages } = todo[i++];
      try {
        const hit = await findPhoto(p, stages);
        cache[p.id] = hit ? hit : { n: 1, t: today, v: CACHE_VERSION };
        if (hit) { found++; bySource[hit.s || "fr"] = (bySource[hit.s || "fr"] || 0) + 1; }
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
  console.log("terminé :", done, "traités,", found, "photos trouvées", JSON.stringify(bySource), ",", failed, "échecs réseau");
  if (consecutiveFail >= 40) console.log("arrêt anticipé (trop d'échecs de suite) : le reste sera repris au prochain passage");
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { nameMatches, findPhoto };
