// Whazup — soirées, clubs et concerts via l'API officielle de Shotgun (accès partenaire gratuit).
// Lancé chaque jour par .github/workflows/shotgun-events.yml. Écrit shotgun-events.json (même format que ticketmaster-events.json).
// La clé est lue dans le secret GitHub SHOTGUN_KEY (jamais écrite dans le code).
// Conditions Shotgun : uniquement les événements publics, chaque fiche renvoie vers Shotgun pour l'achat des billets.
// Doc : GET https://api.shotgun.live/events?key=...&from=...&to=...&cursor=...  (100 événements par page, 100 appels/min max)
const fs = require("fs");

const OUT = "shotgun-events.json";
const REPORT = "shotgun-report.txt";
const KEY = process.env.SHOTGUN_KEY || "";
const BASE = process.env.SG_BASE || "https://api.shotgun.live/events";
const DAYS_AHEAD = 60;
const MAX_KM = 40;         // un événement est rattaché à la ville du site la plus proche, à 40 km maximum
const MAX_PAGES = 400;     // sécurité
const report = [];
const log = (...a) => { const s = a.join(" "); console.log(s); report.push(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function loadCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  const out = []; let m;
  while ((m = re.exec(src.slice(start, end)))) out.push({ key: m[1], name: m[2], lat: +m[3], lng: +m[4] });
  return out;
}
function km(a, b, c, d) {
  const R = 6371, t = (x) => (x * Math.PI) / 180;
  const x = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function addDays(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

// lecture souple des champs (la doc ne décrit pas la réponse : on accepte plusieurs noms possibles)
function get(o, path) { return path.split(".").reduce((x, k) => (x == null ? undefined : (/^\d+$/.test(k) ? x[+k] : x[k])), o); }
function first(o, paths) { for (const p of paths) { const v = get(o, p); if (v != null && v !== "") return v; } return undefined; }
function str(v) { return v == null ? "" : (typeof v === "object" ? (v.fr || v.en || v.name || v.label || "") : String(v)).replace(/\s+/g, " ").trim(); }
function parisParts(s) {
  const d = new Date(s); if (isNaN(d)) return null;
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  return { date: p.slice(0, 10), time: p.slice(11, 16) };
}
function imageOf(e) {
  let v = first(e, ["coverUrl", "cover_url", "imageUrl", "image_url", "image.url", "image", "cover.url", "cover", "images.0.url", "images.0", "picture", "poster", "flyer", "visual"]);
  if (v && typeof v === "object") v = v.url || v.src || v.original || v.large || "";
  return /^https?:\/\//.test(String(v || "")) ? String(v) : "";
}
function linkOf(e) {
  const v = first(e, ["url", "link", "shotgunUrl", "shotgun_url", "ticketUrl", "ticket_url", "ticketingUrl", "eventUrl", "event_url", "permalink"]);
  if (/^https?:\/\//.test(String(v || ""))) return String(v);
  const slug = first(e, ["slug"]);
  return slug ? "https://shotgun.live/events/" + slug : "https://shotgun.live";
}
function priceOf(e) {
  const free = first(e, ["isFree", "is_free", "free"]);
  if (free === true) return "Gratuit";
  let p = first(e, ["ticketing.minimumPrice", "minPrice", "min_price", "lowestPrice", "lowest_price", "price", "priceMin", "price_min", "tickets.0.price", "deals.0.price"]);
  if (p && typeof p === "object") p = p.amount != null ? p.amount : p.value;
  p = Number(p);
  if (isFinite(p) && p > 0) { if (p > 500) p = p / 100; return "Dès " + (Number.isInteger(p) ? String(p) : p.toFixed(2).replace(".", ",")) + " €"; }
  if (isFinite(p) && p === 0) return "Gratuit";
  return "Billetterie Shotgun";
}
function categoryOf(e, title) {
  const tags = [].concat(first(e, ["eventTags"]) || [], first(e, ["typeOfPlace"]) || [], first(e, ["tags"]) || [], first(e, ["genres"]) || [], first(e, ["categories"]) || [], first(e, ["type"]) || [], first(e, ["category"]) || [])
    .map((t) => str(t)).join(" ");
  const t = fold(tags + " " + title);
  if (/\b(immersion|orientation|portes? ouvertes?|casting|shooting|recrutement|formation|webinar|masterclass|conference|salon de l.etudiant|job ?dating)\b/.test(fold(title))) return ["festival", "Divers"];
  if (/\b(concert|live|showcase|tournee|tour)\b/.test(t) && !/\b(dj|club|techno|house|party|soiree|rave)\b/.test(t)) return ["musique", "Musique"];
  if (/\b(stand.?up|humour|comedy|spectacle|theatre)\b/.test(t)) return ["spectacle", "Spectacles"];
  return ["village", "Soirée"];
}

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "whazup-sync/1.0 (+https://whazup.fr)", Accept: "application/json" } });
      if (res.status === 429) { await sleep(15000 * (attempt + 1)); continue; }
      if (!res.ok) return { error: "HTTP " + res.status };
      return { json: await res.json() };
    } catch (e) { await sleep(2000 * (attempt + 1)); }
  }
  return { error: "échec réseau" };
}
const hide = (u) => String(u).replace(/key=[^&]+/, "key=***");

(async () => {
  if (!KEY) { log("Pas de clé SHOTGUN_KEY : rien à faire (ajouter le secret GitHub SHOTGUN_KEY)."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  const cities = loadCities();
  log("Villes lues dans app.js :", cities.length);
  let prev = {};
  try { for (const e of JSON.parse(fs.readFileSync(OUT, "utf8"))) prev[e.id] = e.createdAt; } catch (e) {}

  const from = addDays(0), to = addDays(DAYS_AHEAD);
  let url = BASE + "?" + new URLSearchParams({ key: KEY, from, to }).toString();
  const raw = []; let pages = 0;
  while (url && pages < MAX_PAGES) {
    const r = await getJson(url); pages++;
    if (r.error) { log("Erreur page", pages, ":", r.error, "—", hide(url)); break; }
    const j = r.json;
    const list = Array.isArray(j) ? j : (j.data || j.events || j.results || j.items || []);
    if (pages === 1) {
      log("Clés de la réponse :", Array.isArray(j) ? "(tableau)" : Object.keys(j).join(", "));
      if (list[0]) {
        log("Champs d'un événement :", Object.keys(list[0]).join(", "));
        log("Exemple (1er événement) :", JSON.stringify(list[0]).slice(0, 3000));
      }
    }
    raw.push(...list);
    const next = j && j.pagination && j.pagination.next;
    url = next ? (/^https?:/.test(next) ? next : BASE + (next.startsWith("?") ? next : "?" + next)) : null;
    if (url && !/key=/.test(url)) url += (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(KEY);
    if (list.length < 100) url = null;
    await sleep(700); // < 100 appels par minute
  }
  log("Pages lues :", pages, "— événements reçus :", raw.length);
  // aide au réglage : quelques prix bruts, les types de lieu et les étiquettes les plus fréquents
  try {
    const prices = raw.map((e) => get(e, "ticketing.minimumPrice")).filter((x) => x != null).slice(0, 25);
    log("Exemples de prix bruts (ticketing.minimumPrice) :", JSON.stringify(prices), "— devise :", JSON.stringify(get(raw.find((e) => get(e, "ticketing.currency")) || {}, "ticketing.currency")));
    const cnt = (arr) => Object.entries(arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})).sort((x, y) => y[1] - x[1]).slice(0, 15);
    log("Types de lieu :", JSON.stringify(cnt(raw.map((e) => str(e.typeOfPlace) || "?"))));
    log("Étiquettes :", JSON.stringify(cnt([].concat(...raw.map((e) => (e.eventTags || []).map((t) => str(t)))))));
  } catch (e) {}

  const out = [], seen = new Set();
  const stats = { sansDate: 0, sansPosition: 0, horsVille: 0, passe: 0, annule: 0, ok: 0 };
  const today = from;
  for (const e of raw) {
    const title = str(first(e, ["name", "title", "eventName"]));
    if (!title) continue;
    if (first(e, ["cancelled", "canceled", "isCancelled", "is_cancelled"]) === true || /cancel/i.test(str(first(e, ["status", "state"])))) { stats.annule++; continue; }
    const sp = parisParts(first(e, ["startTime", "start_time", "startDate", "start_date", "startsAt", "starts_at", "start", "beginAt", "date", "dates.start"]));
    if (!sp) { stats.sansDate++; continue; }
    const ep = parisParts(first(e, ["endTime", "end_time", "endDate", "end_date", "endsAt", "ends_at", "end"]));
    if ((ep ? ep.date : sp.date) < today) { stats.passe++; continue; }
    const v = first(e, ["geolocation", "venue", "location", "place", "venues.0", "address"]) || {};
    let lat = Number(first(e, ["venue.latitude", "venue.lat", "venue.geolocation.lat", "venue.geo.lat", "venue.location.lat", "venue.coordinates.lat", "location.latitude", "location.lat", "place.latitude", "place.lat", "latitude", "lat", "geolocation.lat", "geo.lat"]));
    let lng = Number(first(e, ["venue.longitude", "venue.lng", "venue.lon", "venue.geolocation.lng", "venue.geolocation.lon", "venue.geo.lng", "venue.geo.lon", "venue.location.lng", "venue.location.lon", "venue.coordinates.lng", "venue.coordinates.lon", "location.longitude", "location.lng", "location.lon", "place.longitude", "place.lng", "longitude", "lng", "lon", "geolocation.lng", "geolocation.lon", "geo.lng", "geo.lon"]));
    if (!isFinite(lat) || !isFinite(lng) || (!lat && !lng)) { stats.sansPosition++; continue; }
    let best = null, bd = Infinity;
    for (const c of cities) { const d = km(c.lat, c.lng, lat, lng); if (d < bd) { bd = d; best = c; } }
    // si la ville de l'adresse est une ville du site (ex. « Paris »), on la préfère à la plus proche à vol d'oiseau (ex. Bobigny)
    const vcity = fold(str(first(v, ["city", "cityName", "city_name"]))).replace(/[^a-z]+/g, " ").trim();
    const vzip = str(first(v, ["zipCode", "zip_code", "postalCode", "postal_code", "zip"]));
    const named = cities.find((c) => fold(c.name).replace(/[^a-z]+/g, " ").trim() === vcity || (c.key === "paris" && /^75\d{3}$/.test(vzip)));
    if (named) { const d = km(named.lat, named.lng, lat, lng); if (d <= MAX_KM) { best = named; bd = d; } }
    if (!best || bd > MAX_KM) { stats.horsVille++; continue; }
    const date = sp.date < today ? today : sp.date;
    const key = fold(title) + "|" + date + "|" + lat.toFixed(3);
    if (seen.has(key)) continue; seen.add(key);
    const vname = str(first(v, ["placeName", "name", "title"])) || str(first(e, ["venueName", "venue_name", "placeName"]));
    // adresse : « 12 rue X, 75011 Paris » (sans le pays ni le nom du lieu répétés)
    let street = str(first(v, ["street", "rawStreet", "address", "address1", "formattedAddress", "formatted_address"]));
    street = street.replace(/,?\s*(France|Belgique|Suisse|Portugal|Espagne)(,\s*\1)?\s*$/i, "").replace(vname ? new RegExp("^" + vname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ",\\s*", "i") : /^$/, "").trim();
    const addr = street || [str(first(v, ["zipCode", "zip_code", "postalCode", "postal_code", "zip"])), str(first(v, ["city", "cityName", "city_name"]))].filter(Boolean).join(" ");
    const [scene, category] = categoryOf(e, title);
    const sid = first(e, ["id", "eventId", "event_id", "uuid"]);
    const id = "sg-" + (sid != null ? sid : fold(title).replace(/[^a-z0-9]+/g, "-") + "-" + date);
    const o = {
      id, scene, city: best.key, category, title, date, time: sp.date === date ? sp.time : "",
      place: [vname, addr].filter(Boolean).join(", ") || best.name, lat, lng, price: priceOf(e), thumb: "", source: "shotgun",
      createdAt: prev[id] || Date.now(),
      description: str(first(e, ["description", "summary", "shortDescription", "short_description", "about"])).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 400) || ("Billetterie : Shotgun" + (vname ? " · " + vname : "")),
      link: linkOf(e),
    };
    // festival sur plusieurs jours (pas une soirée qui finit après minuit) : affiché chaque jour jusqu'à la fin
    if (ep && (new Date(ep.date) - new Date(date)) / 86400000 >= 2) o.dateEnd = ep.date;
    const img = imageOf(e); if (img) { o.photo = img; o.photoCredit = "Shotgun"; }
    out.push(o); stats.ok++;
  }
  out.sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  log("Résultat :", JSON.stringify(stats));
  const by = {}, byCity = {};
  for (const e of out) { by[e.category] = (by[e.category] || 0) + 1; byCity[e.city] = (byCity[e.city] || 0) + 1; }
  log("Par catégorie :", JSON.stringify(by), "— avec photo :", out.filter((e) => e.photo).length);
  log("Villes couvertes :", Object.keys(byCity).length, "— top :", JSON.stringify(Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10)));
  if (out.length < 5) { log("Trop peu d'événements reconnus : ancien fichier conservé (voir les champs ci-dessus pour ajuster)."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  fs.writeFileSync(OUT, JSON.stringify(out));
  fs.writeFileSync(REPORT, report.join("\n") + "\n");
})();
