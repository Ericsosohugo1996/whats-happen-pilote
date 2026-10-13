// Whazup — concerts, soirées et clubs depuis des agendas OpenAgenda choisis (dont l'agenda officiel « Shotgun »).
// Lancé chaque jour par .github/workflows/openagenda-events.yml. Écrit openagenda-events.json (même format que paris-events.json).
// La clé publique est lue dans le secret GitHub OPENAGENDA_KEY (en-tête "key"). Chaque événement garde le lien vers sa billetterie / sa page d'origine.
const fs = require("fs");
const KEY = process.env.OPENAGENDA_KEY || "";
const BASE = process.env.OA_BASE || "https://api.openagenda.com/v2";
const OUT = "openagenda-events.json", REPORT = "openagenda-events-report.txt";
const DAYS_AHEAD = 60, MAX_KM = 25;
// agendas retenus (voir openagenda-report.txt) : [uid, nom, conserver tout (true) ou seulement les titres musique/soirée (false)]
const AGENDAS = [
  [9969608, "Shotgun", true],
  [889555, "Festival Culture Bar-Bars (Nantes)", true],
  [20272888, "JASS CLUB PARIS", true],
  [94573624, "Rocher de Palmer", true],
  [47666995, "Le Tamanoir", true],
  [88853435, "En Soirée Je Danse Pas", true],
  [7997142, "Sortie 13", true],
  [35648330, "Le Plan", true],
  [20971856, "Rock School Barbey", true],
  [54045603, "Agenda de concerts (Tremblay-en-France)", true],
  [3198948, "OpenAgenda et les événements musicaux", true],
  // --- salles, bars, clubs (on garde tout) ---
  [47052338, "La Sirène (La Rochelle)", true],
  [25970595, "Le Musical (Lille)", true],
  [43757319, "Mar'mousse - Kav, Bar & Resto", true],
  [39942705, "Cabaret Sauvage (Paris)", true],
  [35971985, "L'Estaminet (Magny-les-Hameaux)", true],
  [3037864, "Éclats d'émail jazz (Limoges)", true],
  [99768314, "Tourcoing Jazz (office de tourisme)", false],
  [31182441, "Tourcoing Jazz Festival", true],
  [82566953, "AgendaTrad (bals)", true],
  // --- agendas de villes et métropoles (on garde seulement concerts, soirées, bals, clubs, karaoké…) ---
  [89904399, "Métropole européenne de Lille", false],
  [57621068, "Ville de Lille", false],
  [84178045, "La culture en continu (Lille)", false],
  [83549053, "Bordeaux Métropole", false],
  [83392987, "Ville de Bordeaux", false],
  [5538134, "Ville de Bordeaux - contributeurs", false],
  [96269696, "Carte jeune Bordeaux Métropole", false],
  [19327333, "Bordeaux Tourisme", false],
  [50522407, "Toulouse Métropole", false],
  [42448083, "Toulouse", false],
  [14086709, "Festival Estiv'Oc (Toulouse)", false],
  [82470621, "Nantes Métropole", false],
  [56354628, "Contributions Nantes et métropole", false],
  [20500020, "Rennes Métropole", false],
  [83693824, "Carte Sortir ! (Rennes)", false],
  [17739387, "Mon agenda des métropoles", false],
  [21769447, "Aix-Marseille-Provence Métropole", false],
  [11362982, "Métropole Rouen Normandie", false],
  [11174431, "Rouen", false],
  [6418448, "La Murmure (musiques actuelles de Normandie)", false],
  [35710944, "Agenda de sorties de la métropole orléanaise", false],
  [64168411, "Ville de Limoges", false],
  [49283376, "Villeurbanne", false],
  [38598267, "Ville de Cenon", false],
  [35944609, "Petit Agenda (Perpignan)", false],
  [14115607, "Unidivers (Bayonne)", false],
  [46166621, "Office de tourisme La Baule", false],
  [8530879, "Alsace Destination Tourisme", false],
  [7430297, "Agenda culturel Grand-Est", false],
  [78891697, "Alès Agglomération", false],
  [87311181, "Mains d'Œuvres (Saint-Ouen)", false],
];
const report = [];
const log = (...a) => { const s = a.join(" "); console.log(s); report.push(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const txt = (v) => (v && typeof v === "object" ? v.fr || v.en || Object.values(v)[0] : v) || "";
const strip = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();

function loadCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  const out = []; let m;
  while ((m = re.exec(src.slice(start, end)))) out.push({ key: m[1], lat: +m[3], lng: +m[4] });
  return out;
}
function km(a, b, c, d) {
  const R = 6371, t = (x) => (x * Math.PI) / 180;
  const x = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function parisParts(s) {
  const d = new Date(s); if (isNaN(d)) return null;
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  return { date: p.slice(0, 10), time: p.slice(11, 16) };
}
async function api(path, params) {
  const q = new URLSearchParams();
  for (const [k, v] of params || []) q.append(k, v);
  const url = BASE + path + (q.toString() ? "?" + q.toString() : "");
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { key: KEY, "User-Agent": "whazup-sync/1.0 (+https://whazup.fr)" } });
      if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }
      if (!res.ok) return { error: "HTTP " + res.status };
      return { json: await res.json() };
    } catch (e) { await sleep(1000 * (i + 1)); }
  }
  return { error: "échec réseau" };
}
// pour les agendas généraux (villes, métropoles) : on ne garde que les sorties musique / soirée
const WANT = /concert|\blive\b|\bdj\b|dj set|soiree|\bclub\b|clubbing|\bbal\b|bal (folk|trad|musette|populaire)|jazz|\brock\b|electro|techno|\bhouse\b|\brap\b|hip.?hop|reggae|karaoke|blind.?test|\bjam\b|scene ouverte|open mic|fest.?noz|afterwork|apero|dancing|salsa|bachata|festival.*(musique|jazz|rock)|showcase|release party|\bset\b|chanson|soul|funk|metal|punk|afro/;
const NOT = /atelier|conference|enfant|jeune public|lecture|exposition|visite|stage\b|formation|webinaire|conte\b|cine|projection|club (de|des) (lecture|jeux|seniors?|echecs|photo|codeu)|basket|football|rugby|handball|volley|tennis|\bmatch\b|manga|repair|aquatique|piscine|musee|balade|rando|naturaliste|escape|don du sang|bourse|octobre rose|soiree rose|club lecture|jeux? de societe|soiree (jeux|conference|debat|lecture|litteraire|prevention|bien-etre|rentree|soupes|d'information)|bebe|atelier|cours\b|reunion|permanence|dedicace/;
function wanted(title, keywords) {
  const t = fold(title + " " + (keywords || []).join(" "));
  return WANT.test(t) && !NOT.test(t);
}
function classify(title, keywords) {
  const t = fold(title + " " + (keywords || []).join(" "));
  if (/club|rave|techno|house|electro|dj\b|dj set|afterwork|after hours|after\b|soiree|party|open air|disco|bal\b|clubbing|nuit|karaoke|blind.?test|apero|dancing|salsa|bachata/.test(t)) return ["village", "Soirée"];
  return ["musique", "Musique"];
}

// brocantes, vide-greniers, braderies : recherche dans le jeu de données ouvert « événements publics OpenAgenda » (Opendatasoft, sans clé)
async function fetchBrocantes(cities, nowIso, seen, prev) {
  const ODS = "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records";
  const endIso = new Date(Date.now() + 120 * 86400000).toISOString();
  let where = '(search("brocante") OR search("vide-grenier") OR search("vide grenier") OR search("vide-greniers") OR search("braderie") OR search("marche aux puces")) AND lastdate_end >= date\'' + nowIso.slice(0, 10) + '\'';
  const RX = /brocante|vide.?grenier|vide.?dressing|braderie|marche aux puces|bourse aux/;
  const out = [];
  let offset = 0, total = 0, got = 0, hors = 0, shown = false;
  for (let page = 0; page < 100; page++) {
    const q = new URLSearchParams({ where, limit: "100", offset: String(offset) });
    let json = null;
    for (let i = 0; i < 3 && !json; i++) {
      try {
        const res = await fetch(ODS + "?" + q.toString(), { headers: { "User-Agent": "whazup-sync/1.0 (+https://whazup.fr)" } });
        if (res.ok) json = await res.json(); else { log("Brocantes : HTTP", res.status, (await res.text()).slice(0, 200)); await sleep(1500); }
      } catch (e) { await sleep(1500); }
    }
    if (!json && page === 0 && /lastdate_end/.test(where)) { where = where.replace(/ AND lastdate_end >= date'[^']*'/, ""); log("Brocantes : nouvel essai sans filtre de date"); page = -1; continue; }
    if (!json) break;
    total = json.total_count || total;
    const list = json.results || [];
    if (!shown && list[0]) { shown = true; log("Brocantes — champs reçus :", Object.keys(list[0]).join(", ")); }
    for (const r of list) {
      got++;
      const title = strip(r.title_fr || "");
      if (!title || !RX.test(fold(title))) { hors++; continue; }
      const co = r.location_coordinates || {};
      const lat = +(co.lat != null ? co.lat : r.latitude), lng = +(co.lon != null ? co.lon : r.longitude);
      if (!isFinite(lat) || !isFinite(lng) || (!lat && !lng)) { hors++; continue; }
      let best = null;
      for (const c of cities) { const d = km(c.lat, c.lng, lat, lng); if (!best || d < best.d) best = { c, d }; }
      if (!best || best.d > MAX_KM) { hors++; continue; }
      let tms = [];
      try { tms = typeof r.timings === "string" ? JSON.parse(r.timings) : (r.timings || []); } catch (e) {}
      let begin = null;
      for (const t of tms) { if (t && t.begin && t.end >= nowIso && t.begin <= endIso) { begin = t.begin; break; } }
      if (!begin) { if (r.firstdate_begin && r.firstdate_begin >= nowIso && r.firstdate_begin <= endIso) begin = r.firstdate_begin; }
      if (!begin) { hors++; continue; }
      const s2 = parisParts(begin); if (!s2) continue;
      const key = fold(title) + "|" + s2.date + "|" + lat.toFixed(3);
      if (seen.has(key)) continue; seen.add(key);
      const id = "oa-" + r.uid + "-" + s2.date;
      const cond = strip(r.conditions_fr || "");
      const place = [r.location_name, r.location_address].map((x) => String(x || "").trim()).filter(Boolean).join(", ");
      const o = {
        id, scene: "marche", city: best.c.key, category: "Brocante", title, date: s2.date, time: s2.time === "00:00" ? "" : s2.time,
        place, lat, lng, price: /gratuit|entr[ée]e libre|free/i.test(cond) ? "Gratuit" : (cond ? cond.slice(0, 60) : "Voir sur place"),
        thumb: "", source: "openagenda", createdAt: prev[id] || Date.now(),
        description: strip(r.description_fr || "").slice(0, 300) || "Brocante / vide-grenier",
      };
      if (r.canonicalurl) o.link = r.canonicalurl;
      const im = typeof r.image === "string" ? r.image : (r.image && r.image.url) || ""; if (im) { o.photo = im; o.photoCredit = "OpenAgenda"; }
      out.push(o);
    }
    offset += 100;
    if (!list.length || offset >= Math.min(total, 9900)) break;
    await sleep(300);
  }
  log("Brocantes / vide-greniers — trouvés :", total, "— lus :", got, "— gardés :", out.length, "— écartés :", hors);
  return out;
}

function linkOf(ev) {
  const reg = Array.isArray(ev.registration) ? ev.registration.find((r) => r && r.type === "link" && r.value) : null;
  if (reg) return reg.value;
  const l = Array.isArray(ev.links) ? ev.links.find((x) => x && x.link) : null;
  if (l) return l.link;
  return ev.canonicalUrl || "";
}
function imageOf(ev) {
  const im = ev.image;
  if (!im) return "";
  if (typeof im === "string") return im;
  if (im.base && im.filename) return im.base + im.filename;
  return "";
}

(async () => {
  if (!KEY) { log("Pas de clé OPENAGENDA_KEY."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  const cities = loadCities();
  log("Villes lues dans app.js :", cities.length);
  if (cities.length < 20) { log("Trop peu de villes : ancien fichier conservé."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  let prev = {};
  try { for (const e of JSON.parse(fs.readFileSync(OUT, "utf8"))) prev[e.id] = e.createdAt; } catch (e) {}
  const now = new Date(), nowIso = now.toISOString(), endIso = new Date(now.getTime() + DAYS_AHEAD * 86400000).toISOString();
  const out = [], seen = new Set();
  let errors = 0, sample = null;
  for (const [uid, name, keepAll] of AGENDAS) {
    let after = null, got = 0, kept = 0, hors = 0;
    for (let page = 0; page < 30; page++) {
      const p = [["relative[]", "upcoming"], ["timings[gte]", nowIso], ["timings[lte]", endIso], ["size", "300"], ["detailed", "1"], ["monolingual", "fr"], ["sort", "timings.asc"]];
      if (after) for (const a of after) p.push(["after[]", a]);
      const r = await api("/agendas/" + uid + "/events", p);
      await sleep(200);
      if (r.error) { errors++; log("Erreur", name, r.error); break; }
      const list = r.json.events || [];
      for (const ev of list) {
        got++;
        if (!sample) sample = ev;
        if (ev.status === 6 || ev.status === 4 || ev.status === 3) continue; // annulé, reporté, en ligne seulement
        const loc = ev.location || {};
        const lat = +loc.latitude, lng = +loc.longitude;
        if (!isFinite(lat) || !isFinite(lng) || (!lat && !lng)) { hors++; continue; }
        let best = null;
        for (const c of cities) { const d = km(c.lat, c.lng, lat, lng); if (!best || d < best.d) best = { c, d }; }
        if (!best || best.d > MAX_KM) { hors++; continue; }
        const tm = (Array.isArray(ev.timings) ? ev.timings : []).find((t) => t && t.begin && t.end >= nowIso && t.begin <= endIso) || (ev.timings || [])[0];
        if (!tm || !tm.begin) continue;
        const s = parisParts(tm.begin); if (!s) continue;
        const title = strip(txt(ev.title));
        if (!title) continue;
        if (keepAll === false && !wanted(title, ev.keywords)) { hors++; continue; }
        const key = fold(title) + "|" + s.date + "|" + lat.toFixed(3);
        if (seen.has(key)) continue; seen.add(key);
        const [scene, category] = classify(title, ev.keywords);
        const id = "oa-" + ev.uid + "-" + s.date;
        const cond = strip(txt(ev.conditions));
        const price = /gratuit|entr[ée]e libre|free/i.test(cond) ? "Gratuit" : (name === "Shotgun" ? "Billetterie en ligne" : (cond ? cond.slice(0, 60) : "Voir sur place"));
        const place = [txt(loc.name), txt(loc.address)].map((x) => String(x || "").trim()).filter(Boolean).join(", ");
        const o = {
          id, scene, city: best.c.key, category, title, date: s.date, time: s.time === "00:00" ? "" : s.time,
          place, lat, lng, price, thumb: "", source: "openagenda", createdAt: prev[id] || Date.now(),
          description: strip(txt(ev.description)).slice(0, 300) || ("Source : " + name),
        };
        const lk = linkOf(ev); if (lk) o.link = lk;
        const im = imageOf(ev); if (im) { o.photo = im; o.photoCredit = name + " (OpenAgenda)"; }
        out.push(o); kept++;
      }
      after = r.json.after;
      if (!after || !list.length) break;
    }
    log("Agenda", name, "— reçus :", got, "— gardés :", kept, "— écartés (hors villes / sans position / pas musique-soirée) :", hors);
  }
  try { for (const e of await fetchBrocantes(cities, nowIso, seen, prev)) out.push(e); } catch (e) { log("Brocantes : erreur", e.message); }
  out.sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const by = {}, byCity = {};
  for (const e of out) { by[e.category] = (by[e.category] || 0) + 1; byCity[e.city] = (byCity[e.city] || 0) + 1; }
  log("Résultat :", out.length, "événements — par catégorie :", JSON.stringify(by));
  log("Villes couvertes :", Object.keys(byCity).length, "— top :", JSON.stringify(Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10)));
  if (sample) log("Exemple brut (pour vérifier la structure) :", JSON.stringify(sample).slice(0, 1500));
  if (errors > AGENDAS.length / 2 || out.length < 20) { log("Résultat insuffisant : ancien fichier conservé."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  fs.writeFileSync(OUT, JSON.stringify(out));
  fs.writeFileSync(REPORT, report.join("\n") + "\n");
})();
