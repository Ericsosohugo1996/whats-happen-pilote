// Robot « Photos des organisateurs » : récupère l'image de partage (og:image) de la page de l'événement
// pour les événements qui n'ont qu'une illustration. Règles de politesse :
//  - respecte robots.txt de chaque site, 1 seconde minimum entre deux demandes au même site
//  - ne télécharge jamais l'image : Whazup l'affiche depuis le site de l'organisateur, avec son nom et un lien
//  - ignore Facebook, Instagram, Ticketmaster et les agrégateurs
//  - une image identique sur beaucoup de pages d'un même site = logo du site : ignorée
const fs = require("fs");
const path = require("path");
const START = Date.now();
const TIME_UP = () => Date.now() - START > 17 * 60 * 1000;
const UA = "WhazupBot/1.0 (+https://whazup.fr; image de partage des evenements, respecte robots.txt)";
const SKIP_HOST = /(^|\.)(facebook|instagram|fb|twitter|x|tiktok|youtube|google|ticketmaster|fnac|openagenda|billetreduc|eventbrite|shotgun|dice)\.(com|fr|co|me|fm)$|(^|\.)(wikipedia|wikimedia)\.org$/i;
const BAD_IMG = /logo|favicon|sprite|placeholder|default|picto|icon|avatar|\.svg|\.gif|blank|no-?image|noimage|header|banner-site|share-default|og-default/i;
const MAX_PER_RUN = 4000;
const CACHE = "og-photos.json";

function host(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function get(url, ms) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms || 8000);
  try { return await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*;q=0.5", "Accept-Language": "fr" }, signal: ac.signal, redirect: "follow" }); }
  finally { clearTimeout(t); }
}

// lit au plus `max` octets d'une réponse, et au plus `ms` millisecondes (un site qui n'en finit pas ne bloque plus le robot)
async function readCapped(r, max, ms) {
  if (!r.body || !r.body.getReader) { return (await r.text()).slice(0, max); }
  const reader = r.body.getReader(); const dec = new TextDecoder("utf-8", { fatal: false });
  let out = "", got = 0; const end = Date.now() + (ms || 10000);
  try {
    while (got < max && Date.now() < end) {
      const left = end - Date.now();
      const chunk = await Promise.race([reader.read(), new Promise((res) => setTimeout(() => res({ timeout: true }), left))]);
      if (!chunk || chunk.timeout || chunk.done) break;
      got += chunk.value.length; out += dec.decode(chunk.value, { stream: true });
    }
  } finally { try { await reader.cancel(); } catch (e) {} }
  return out.slice(0, max);
}

const robotsCache = {};
async function allowed(u) {
  const h = new URL(u).origin;
  if (!(h in robotsCache)) {
    let rules = [];
    try {
      const r = await get(h + "/robots.txt", 6000);
      if (r.ok) {
        const txt = await readCapped(r, 100000, 6000);
        let mine = false, any = false; const star = [], ours = [];
        for (const raw of txt.split(/\r?\n/)) {
          const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
          const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
          const k = m[1].toLowerCase(), v = m[2].trim();
          if (k === "user-agent") { const ua = v.toLowerCase(); mine = ua === "*" ? "star" : (ua.includes("whazup") ? "ours" : false); any = true; }
          else if (k === "disallow" && v && mine === "star") star.push(v);
          else if (k === "disallow" && v && mine === "ours") ours.push(v);
        }
        rules = ours.length ? ours : star;
      } else if (r.status === 401 || r.status === 403) rules = ["/"];
    } catch (e) { rules = []; }
    robotsCache[h] = rules;
  }
  const p = new URL(u).pathname + new URL(u).search;
  return !robotsCache[h].some((d) => d === "/" || p.startsWith(d.replace(/\*.*$/, "")) && d.replace(/\*.*$/, "") !== "");
}

function metaImage(html, base) {
  const head = html.slice(0, 250000);
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*(noai|noimageai)/i.test(head)) return "";
  const pats = [/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i, /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i, /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i, /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i];
  for (const p of pats) {
    const m = head.match(p); if (!m) continue;
    try { return new URL(m[1].replace(/&amp;/g, "&"), base).href; } catch (e) {}
  }
  return "";
}

async function lookup(link) {
  if (!(await allowed(link))) return { n: "robots" };
  const r = await get(link, 9000);
  if (!r.ok) return { n: "http" + r.status };
  if (!/text\/html/i.test(r.headers.get("content-type") || "")) return { n: "nothtml" };
  const html = await readCapped(r, 300000, 10000);
  const img = metaImage(html, r.url || link);
  if (!img || !/^https:\/\//i.test(img) || BAD_IMG.test(img)) return { n: "noimg" };
  return { u: img, d: host(r.url || link) };
}

async function main() {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) {}
  if (cache._v !== 1) cache = { _v: 1 };
  const todo = {};
  for (const f of fs.readdirSync("data/events")) {
    if (!f.endsWith(".json") || f.endsWith(".soon.json")) continue;
    let d = []; try { d = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
    for (const ev of d) {
      if (ev.photo && !ev.photoGeneric && !ev.photoVenue) continue; // vraie affiche ou photo d'artiste
      const link = ev.link || ev.ticket || ""; if (!/^https?:\/\//i.test(link)) continue;
      const h = host(link); if (!h || SKIP_HOST.test(h)) continue;
      if (link in cache) continue;
      (todo[h] = todo[h] || new Set()).add(link);
    }
  }
  // un site après l'autre en alternance, pour ne jamais en solliciter un seul trop vite
  const queues = Object.entries(todo).map(([h, s]) => [h, [...s]]);
  console.log("sites :", queues.length, "pages à regarder :", queues.reduce((a, q) => a + q[1].length, 0));
  const saveNow = () => { try { fs.writeFileSync(CACHE, JSON.stringify(cache)); } catch (e) {} };
  process.on("SIGTERM", () => { saveNow(); process.exit(1); }); process.on("SIGINT", () => { saveNow(); process.exit(1); });
  process.on("unhandledRejection", (e) => console.log("erreur ignorée :", e && e.message));
  let tried = 0, found = 0; const last = {}; const reasons = {};
  // 8 « ouvriers » en parallèle : chacun prend la page suivante d'un site ; un même site n'est jamais sollicité plus d'une fois par seconde
  let qi = 0, stop = false;
  function nextJob() {
    for (let n = 0; n < queues.length; n++) {
      const q = queues[qi++ % queues.length];
      if (q[1].length) return [q[0], q[1].shift()];
    }
    return null;
  }
  async function worker() {
    while (!stop) {
      if (TIME_UP() || tried >= MAX_PER_RUN) { stop = true; break; }
      const job = nextJob(); if (!job) break;
      const [h, link] = job;
      const wait = (last[h] || 0) + 1000 - Date.now(); last[h] = Math.max(Date.now(), (last[h] || 0) + 1000);
      if (wait > 0) await sleep(wait);
      tried++;
      try { const r = await lookup(link); cache[link] = r; if (r.u) found++; else reasons[r.n] = (reasons[r.n] || 0) + 1; }
      catch (e) { cache[link] = { n: "err" }; reasons.err = (reasons.err || 0) + 1; }
      if (tried % 200 === 0) { console.log("…", tried, "pages,", found, "images, mémoire", Math.round(process.memoryUsage().rss / 1048576), "Mo"); saveNow(); }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  if (stop) console.log("on s'arrête ici (relance pour continuer)");
  // image identique sur beaucoup de pages d'un même site = logo du site
  const perImg = {};
  for (const [k, v] of Object.entries(cache)) if (v && v.u) (perImg[v.d + "|" + v.u] = perImg[v.d + "|" + v.u] || []).push(k);
  let logos = 0;
  for (const ks of Object.values(perImg)) if (ks.length >= 4) for (const k of ks) { cache[k] = { n: "logo" }; logos++; }
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  console.log("terminé :", tried, "pages,", found, "images,", logos, "logos écartés. Refus/échecs :", JSON.stringify(reasons));
  console.log("exemples :\n" + Object.entries(cache).filter(([k, v]) => v && v.u).slice(-10).map(([k, v]) => v.d + " → " + v.u.slice(0, 90)).join("\n"));
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { metaImage, host };
