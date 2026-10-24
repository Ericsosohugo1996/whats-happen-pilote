// Whazup — pages « Sorties » lisibles par Google, mises à jour chaque nuit.
// Pour chaque ville (et chaque commune qui a assez de sorties) :
//   sorties/<ville>/                    → sorties des 14 prochains jours
//   sorties/<ville>/concerts/ expos/ spectacles/ marches/ gratuit/ ce-week-end/   → pages ciblées
// Lit data/events/*.json (créé par split-data.js) et écrit sorties/, sitemap.xml.
// Une page avec trop peu de sorties n'est pas créée (Google n'aime pas les pages vides).
// Pour tout retirer : supprimer le dossier sorties/, ce fichier, son workflow, et remettre l'ancien sitemap.xml.
const fs = require("fs");
const path = require("path");

const SITE = "https://whazup.fr";
const MIN_EVENTS = 15;          // page principale d'une ville : minimum de sorties
const MIN_COMMUNE = 12;         // page principale d'une commune (hors grandes villes)
const MIN_THEME = 5;            // page ciblée : minimum de sorties
const MIN_PLACES = 5;           // page « à voir » : minimum de lieux
const MAX_PLACES = 24;
const MIN_WEEKEND = 8;          // page « ce week-end » : minimum de sorties
const DAYS = 14;
const MAX_LISTED = 40, MAX_THEME_LISTED = 30, MAX_LD = 15;
const OUT = "sorties";

const THEMES = [
  { slug: "concerts", label: "Concerts", one: "concerts", test: (e) => e.category === "Musique" },
  { slug: "expos", label: "Expos", one: "expositions", test: (e) => e.category === "Expo" },
  { slug: "spectacles", label: "Spectacles", one: "spectacles", test: (e) => e.category === "Spectacles" },
  { slug: "marches", label: "Marchés", one: "marchés et brocantes", test: (e) => e.category === "Marché" || e.category === "Brocante" },
  { slug: "gratuit", label: "Sorties gratuites", one: "sorties gratuites", test: (e) => /^(gratuit(?! sous)|entr[ée]e libre|acc[èe]s libre)/i.test(String(e.price || "").trim()) },
  { slug: "a-voir", label: "À voir", places: true },
  { slug: "ce-week-end", label: "Ce week-end", one: "sorties ce week-end", weekend: true }
];

const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slugify = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nameKey = (s) => fold(s).replace(/[’']/g, " ").replace(/\bsaint(e?)\b/g, "st$1").replace(/[^a-z0-9]+/g, " ").trim();

function parisToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function addDays(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function dayLabel(iso, today) {
  const d = new Date(iso + "T12:00:00Z");
  const base = DAYS_FR[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS_FR[d.getUTCMonth()];
  if (iso === today) return "Aujourd’hui · " + base;
  if (iso === addDays(today, 1)) return "Demain · " + base;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
function shortDate(iso) { const d = new Date(iso + "T12:00:00Z"); return d.getUTCDate() + " " + MONTHS_FR[d.getUTCMonth()]; }
function weekendRange(today) {
  const dow = new Date(today + "T12:00:00Z").getUTCDay(); // 0 dim … 6 sam
  const toFri = dow === 0 ? -2 : dow === 6 ? -1 : (5 - dow + 7) % 7;
  const start = toFri <= 0 ? today : addDays(today, toFri);
  const toSun = dow === 0 ? 0 : 7 - dow;
  const end = dow >= 5 || dow === 0 ? addDays(today, toSun) : addDays(start, 2);
  return [start, end];
}

function readCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)"/gm;
  const out = {}; let m;
  while ((m = re.exec(src.slice(start, end)))) out[m[1]] = m[2];
  return out;
}

const CSS = [
  ":root{--navy:#14213D;--coral:#E8604C;--bg:#EEF3FB;--card:#fff;--muted:#5b6785}",
  "*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--navy);font:16px/1.55 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif}",
  "header{background:var(--navy);color:#fff;padding:14px 16px}header a{color:#fff;text-decoration:none;font:700 22px/1 Georgia,'Times New Roman',serif}header span{color:var(--coral)}",
  "main{max-width:720px;margin:0 auto;padding:20px 16px 48px}",
  "h1{font:700 28px/1.2 Georgia,'Times New Roman',serif;margin:8px 0 10px}h2{font:700 18px/1.3 Georgia,serif;margin:28px 0 10px}",
  ".lead{color:var(--muted);margin:0 0 16px}.crumb{font-size:14px;color:var(--muted);margin:0}.crumb a{color:var(--muted)}",
  ".cta{display:inline-block;background:var(--coral);color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:14px;margin:6px 0 4px}",
  ".day{font-weight:700;margin:22px 0 8px;color:var(--navy)}",
  "ul{list-style:none;margin:0;padding:0}li{background:var(--card);border-radius:14px;padding:12px 14px;margin:0 0 8px;box-shadow:0 1px 2px rgba(20,33,61,.06)}",
  "li b{display:block}li small{color:var(--muted)}.tag{display:inline-block;font-size:12px;font-weight:700;color:var(--coral);margin-right:8px}",
  ".cities,.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0}.cities li,.chips li{padding:0;background:none;box-shadow:none;margin:0}.cities a,.chips a{display:block;background:var(--card);color:var(--navy);text-decoration:none;padding:8px 14px;border-radius:999px;font-weight:600}.chips a.on{background:var(--navy);color:#fff}",
  "footer{color:var(--muted);font-size:13px;margin-top:32px}footer a{color:var(--muted)}"
].join("\n");

function shell({ title, desc, canonical, body, ld }) {
  return "<!doctype html>\n<html lang=\"fr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n" +
    "<title>" + esc(title) + "</title>\n<meta name=\"description\" content=\"" + esc(desc) + "\">\n<link rel=\"canonical\" href=\"" + esc(canonical) + "\">\n" +
    "<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:title\" content=\"" + esc(title) + "\">\n<meta property=\"og:description\" content=\"" + esc(desc) + "\">\n" +
    "<meta property=\"og:url\" content=\"" + esc(canonical) + "\">\n<meta property=\"og:image\" content=\"" + SITE + "/680cfd7d-7105-4e25-bff2-1826063c32d9.jpg\">\n" +
    "<meta name=\"theme-color\" content=\"#14213D\">\n<link rel=\"icon\" href=\"/favicon.ico\">\n<link rel=\"stylesheet\" href=\"/" + OUT + "/s.css\">\n" +
    (ld ? "<script type=\"application/ld+json\">" + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>\n" : "") +
    "</head>\n<body>\n<header><a href=\"/\">Wha<span>zup</span></a></header>\n<main>\n" + body +
    "\n<footer>Whazup rassemble les sorties de toute la France. <a href=\"/sorties/\">Toutes les villes</a> · <a href=\"/mentions-legales.html\">Mentions légales</a> · <a href=\"/confidentialite.html\">Confidentialité</a></footer>\n</main>\n</body>\n</html>\n";
}

const km = (a, b, c, d) => { const t = (x) => x * Math.PI / 180, dl = t(c - a), dn = t(d - b); const x = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dn / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(x)); };

function itemsHtml(ev, today, max) {
  let html = "", curDay = "";
  for (const e of ev.slice(0, max)) {
    if (e.date !== curDay) { if (curDay) html += "</ul>\n"; curDay = e.date; html += "<div class=\"day\">" + esc(dayLabel(e.date, today)) + "</div>\n<ul>\n"; }
    const meta = [e.time ? e.time.replace(":", "h") : "", String(e.place || "").split(",")[0].slice(0, 60), e.price && !/voir sur place|non pr/i.test(e.price) ? String(e.price).slice(0, 20) : ""].filter(Boolean).join(" · ");
    html += "<li><span class=\"tag\">" + esc(e.category || "Sortie") + "</span><b>" + esc(String(e.title).slice(0, 110)) + "</b>" + (meta ? "<small>" + esc(meta) + "</small>" : "") + "</li>\n";
  }
  if (curDay) html += "</ul>\n";
  return html;
}
function ldList(name, ev, label) {
  return {
    "@context": "https://schema.org", "@type": "ItemList", name: label + " " + name,
    itemListElement: ev.slice(0, MAX_LD).map((e, i) => ({
      "@type": "ListItem", position: i + 1,
      item: {
        "@type": "Event", name: String(e.title).slice(0, 110),
        startDate: e.date + (e.time ? "T" + e.time : ""),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: { "@type": "Place", name: String(e.place || name).split(",")[0].slice(0, 80), address: String(e.place || name).slice(0, 160) }
      }
    }))
  };
}
const joinFr = (a) => a.join(", ").replace(/, ([^,]*)$/, " et $1");
const sortEv = (l) => l.sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")));
const prep = (s) => (/^[AEIOUYÉÈÊH]/i.test(s) && !/^(Hy|Hu)/i.test(s) ? "à " : "à ") + s; // « à » partout (Le Havre → à Le Havre reste lisible)

function readPlaces(key, name) {
  let l = [];
  try { l = JSON.parse(fs.readFileSync(path.join("data", "places", key + ".json"), "utf8")); } catch (e) { return []; }
  if (!Array.isArray(l)) return [];
  const nk = nameKey(name);
  const seen = new Set();
  return l.filter((p) => p && p.title && (p.description || "").length > 60 && !seen.has(nameKey(p.title)) && seen.add(nameKey(p.title)))
    .map((p) => ({ p, s: (nameKey(p.place || "").includes(nk) ? 1000 : 0) + Math.min(String(p.description).length, 400) + (p.thumb ? 150 : 0) + (/mus[ée]e|ch[âa]teau|cath[ée]drale|basilique|abbaye|jardin|parc |palais|tour |monument|forteresse|citadelle|fort |grotte|panorama|remparts|op[ée]ra|[ée]glise|chapelle|hôtel de ville|vieux|historique|patrimoine/i.test(p.title) ? 400 : 0) - (/cours |atelier|stage|boutique|restaurant|location|vente|h[ôo]tel(?! de ville)|gîte|camping|salle des f/i.test(p.title) ? 900 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, MAX_PLACES).map((x) => x.p);
}
const clip = (t, n) => { t = String(t).replace(/\s+/g, " ").trim(); if (t.length <= n) return t; t = t.slice(0, n); return t.replace(/\s+\S*$/, "") + "…"; };
function placesHtml(pl, max) {
  return "<ul>\n" + pl.slice(0, max).map((p) => "<li><span class=\"tag\">À voir</span><b>" + esc(String(p.title).slice(0, 100)) + "</b><small>" + esc(String(p.place || "").split(",").slice(-1)[0].trim().slice(0, 50)) + "</small><br><small>" + esc(clip(p.description, 170)) + "</small></li>").join("\n") + "\n</ul>\n";
}

function main() {
  const cities = readCities();
  const today = parisToday(), last = addDays(today, DAYS);
  const [wkA, wkB] = weekendRange(today);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "s.css"), CSS + "\n");

  // 1. lecture de tous les fichiers de villes
  const hubs = {}; const all = new Map(); // all : événements dédoublonnés, avec la ville source
  for (const key of Object.keys(cities)) {
    let list = [];
    try { list = JSON.parse(fs.readFileSync(path.join("data", "events", key + ".json"), "utf8")); } catch (e) { continue; }
    if (!Array.isArray(list)) continue;
    const ev = sortEv(list.filter((e) => e && e.title && e.date && e.date >= today && e.date <= last));
    hubs[key] = ev;
    for (const e of ev) { const id = e.id || (e.title + "|" + e.date + "|" + e.place); if (!all.has(id)) all.set(id, { e, src: key }); }
  }

  // 2. communes (hors villes déjà couvertes) : adresse de l'événement validée par la liste officielle des communes
  const hubNames = new Set(Object.values(cities).map(nameKey));
  let communes = {};
  try { communes = JSON.parse(fs.readFileSync("communes.json", "utf8")); } catch (e) { communes = []; }
  const byName = new Map();
  for (const c of communes) { const k = nameKey(c[0]); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(c); }
  const com = new Map();
  for (const { e, src } of all.values()) {
    const segs = String(e.place || "").split(",").map((s) => s.trim()).filter(Boolean);
    let hit = null;
    for (const s of segs.slice().reverse().slice(0, 2)) {
      const nm = s.replace(/^\d{5}\s*/, "").replace(/\s*\d{5}$/, "").replace(/\bcedex\b.*$/i, "").trim();
      const k = nameKey(nm);
      if (!k || hubNames.has(k)) continue;
      const cs = byName.get(k); if (!cs) continue;
      let best = null, bd = 1e9;
      for (const c of cs) { const d = (e.lat && e.lng) ? km(e.lat, e.lng, c[2], c[3]) : (cs.length === 1 ? 0 : 1e9); if (d < bd) { bd = d; best = c; } }
      if (best && bd <= 8) { hit = best; break; }
    }
    if (!hit) continue;
    const ck = hit[0] + "|" + hit[1];
    if (!com.has(ck)) com.set(ck, { name: hit[0], dept: hit[1], ev: [], src: {} });
    const o = com.get(ck); o.ev.push(e); o.src[src] = (o.src[src] || 0) + 1;
  }

  // 3. liste des entités qui auront des pages
  const ents = [];
  const usedSlugs = new Set();
  const take = (base, dept) => { let s = slugify(base); if (!s) return null; if (usedSlugs.has(s)) s = s + "-" + (dept || "x"); if (usedSlugs.has(s)) return null; usedSlugs.add(s); return s; };
  for (const key of Object.keys(hubs)) {
    if (hubs[key].length < MIN_EVENTS) continue;
    const slug = take(cities[key], key); if (!slug) continue;
    ents.push({ kind: "ville", slug, name: cities[key], key, ev: hubs[key] });
  }
  for (const o of [...com.values()].sort((a, b) => b.ev.length - a.ev.length)) {
    if (o.ev.length < MIN_COMMUNE) continue;
    const key = Object.entries(o.src).sort((a, b) => b[1] - a[1])[0][0];
    const slug = take(o.name, o.dept); if (!slug) continue;
    ents.push({ kind: "commune", slug, name: o.name, key, ev: sortEv(o.ev) });
  }

  // 4. écriture des pages
  const urls = [];
  const write = (rel, html) => { const dir = path.join(OUT, rel); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "index.html"), html); };
  let nMain = 0, nTheme = 0;
  for (const E of ents) {
    const { name, slug, key, ev } = E;
    const cta = "/?ville=" + encodeURIComponent(key) + "&amp;page=accueil";
    // pages ciblées de cette ville
    const tp = [];
    const pl = E.kind === "ville" ? readPlaces(key, name) : [];
    for (const T of THEMES) {
      if (T.places) { if (pl.length >= MIN_PLACES) tp.push({ T, sub: pl, from: today, to: last }); continue; }
      let sub, from = today, to = last;
      if (T.weekend) { sub = ev.filter((e) => e.date >= wkA && e.date <= wkB); from = wkA; to = wkB; }
      else sub = ev.filter(T.test);
      if (sub.length < (T.weekend ? MIN_WEEKEND : MIN_THEME)) continue;
      tp.push({ T, sub, from, to });
    }
    const chips = (cur) => {
      const li = ["<li><a" + (cur === "" ? " class=\"on\"" : "") + " href=\"/" + OUT + "/" + slug + "/\">Tout</a></li>"].concat(tp.map((t) => "<li><a" + (cur === t.T.slug ? " class=\"on\"" : "") + " href=\"/" + OUT + "/" + slug + "/" + t.T.slug + "/\">" + esc(t.T.label) + "</a></li>"));
      return li.length > 1 ? "<ul class=\"chips\">\n" + li.join("\n") + "\n</ul>\n" : "";
    };

    // page principale
    const cat = {};
    for (const e of ev) cat[e.category || "Divers"] = (cat[e.category || "Divers"] || 0) + 1;
    const top = Object.entries(cat).sort((a, b) => b[1] - a[1]).filter((x) => x[0] !== "Divers").slice(0, 3).map((x) => x[0].toLowerCase());
    const intro = ev.length + " sorties à " + name + " et autour dans les " + DAYS + " prochains jours" + (top.length ? " : surtout " + joinFr(top) : "") + ". Mise à jour chaque jour.";
    let html = "<h1>Sorties à " + esc(name) + " cette semaine</h1>\n<p class=\"lead\">" + esc(intro) + "</p>\n" + chips("") +
      "<a class=\"cta\" href=\"/?ville=" + encodeURIComponent(key) + "&amp;page=accueil\">Voir les sorties à " + esc(name) + " sur Whazup</a>\n" + itemsHtml(ev, today, MAX_LISTED);
    if (ev.length > MAX_LISTED) html += "<p class=\"lead\">… et " + (ev.length - MAX_LISTED) + " autres sorties sur Whazup.</p>\n<a class=\"cta\" href=\"/?ville=" + encodeURIComponent(key) + "&amp;page=accueil\">Tout voir sur Whazup</a>\n";
    if (pl.length >= MIN_PLACES) html += "<h2>À voir à " + esc(name) + "</h2>\n" + placesHtml(pl, 5) + "<a class=\"cta\" href=\"/" + OUT + "/" + slug + "/a-voir/\">Tous les lieux à visiter à " + esc(name) + "</a>\n";
    const canonical = SITE + "/" + OUT + "/" + slug + "/";
    write(slug, shell({
      title: "Sorties à " + name + " cette semaine : concerts, expos, spectacles | Whazup",
      desc: ev.length + " sorties à " + name + " dans les " + DAYS + " prochains jours : concerts, expositions, spectacles, marchés, soirées. Ce soir, demain ou ce week-end.",
      canonical, body: html, ld: ldList(name, ev, "Sorties à")
    }));
    urls.push({ u: canonical, p: "0.7" }); nMain++;

    // pages ciblées
    for (const { T, sub, from, to } of tp) {
      if (T.places) {
        const can = SITE + "/" + OUT + "/" + slug + "/a-voir/";
        const body = "<p class=\"crumb\"><a href=\"/" + OUT + "/\">Sorties</a> › <a href=\"/" + OUT + "/" + slug + "/\">" + esc(name) + "</a></p>\n<h1>Que visiter à " + esc(name) + " ? Les lieux à ne pas manquer</h1>\n<p class=\"lead\">" + sub.length + " lieux à voir à " + esc(name) + " et autour : monuments, musées, patrimoine et sites remarquables.</p>\n" + chips("a-voir") + placesHtml(sub, MAX_PLACES) +
          "<a class=\"cta\" href=\"" + cta + "\">Voir les sorties à " + esc(name) + " sur Whazup</a>\n";
        const ld = { "@context": "https://schema.org", "@type": "ItemList", name: "À voir à " + name, itemListElement: sub.slice(0, MAX_LD).map((p, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "TouristAttraction", name: String(p.title).slice(0, 100), description: clip(p.description, 200), address: String(p.place || "").slice(0, 160) } })) };
        write(slug + "/a-voir", shell({ title: "Que visiter à " + name + " ? " + sub.length + " lieux à ne pas manquer | Whazup", desc: "Que voir à " + name + " : " + sub.slice(0, 3).map((p) => p.title).join(", ") + " et " + (sub.length - 3) + " autres lieux à visiter.", canonical: can, body, ld }));
        urls.push({ u: can, p: "0.6" }); nTheme++;
        continue;
      }
      const n = sub.length;
      const days = new Set(sub.map((e) => e.date)).size;
      const places = [...new Set(sub.map((e) => String(e.place || "").split(",")[0].trim()).filter((x) => x && x.length < 50))].slice(0, 3);
      let h1, title, desc, intro2;
      if (T.weekend) {
        h1 = "Sorties à " + name + " ce week-end";
        title = "Que faire à " + name + " ce week-end (" + shortDate(from) + " au " + shortDate(to) + ") | Whazup";
        desc = n + " sorties à " + name + " ce week-end, du " + shortDate(from) + " au " + shortDate(to) + " : concerts, expos, spectacles, marchés, sorties gratuites.";
        intro2 = n + " sorties à " + name + " du " + shortDate(from) + " au " + shortDate(to) + (places.length ? ", notamment " + joinFr(places) : "") + ".";
      } else if (T.slug === "gratuit") {
        h1 = "Sorties gratuites à " + name;
        title = "Sorties gratuites à " + name + " : " + n + " idées à venir | Whazup";
        desc = n + " sorties gratuites à " + name + " dans les " + DAYS + " prochains jours : expos, concerts, spectacles, animations en entrée libre.";
        intro2 = n + " sorties gratuites à " + name + " dans les " + DAYS + " prochains jours, répartis sur " + days + " jour" + (days > 1 ? "s" : "") + (places.length ? ", notamment " + joinFr(places) : "") + ".";
      } else {
        const L = T.label;
        h1 = L + " à " + name;
        title = L + " à " + name + " : " + n + " à venir | Whazup";
        desc = n + " " + T.one + " à " + name + " dans les " + DAYS + " prochains jours, avec dates, horaires et lieux. Mis à jour chaque jour.";
        intro2 = n + " " + T.one + " à " + name + " dans les " + DAYS + " prochains jours, répartis sur " + days + " jour" + (days > 1 ? "s" : "") + (places.length ? ", notamment " + joinFr(places) : "") + ".";
      }
      const body = "<p class=\"crumb\"><a href=\"/" + OUT + "/\">Sorties</a> › <a href=\"/" + OUT + "/" + slug + "/\">" + esc(name) + "</a></p>\n<h1>" + esc(h1) + "</h1>\n<p class=\"lead\">" + esc(intro2) + " Mise à jour chaque jour.</p>\n" + chips(T.slug) +
        "<a class=\"cta\" href=\"" + cta + "\">Voir les sorties à " + esc(name) + " sur Whazup</a>\n" + itemsHtml(sub, today, MAX_THEME_LISTED) +
        (n > MAX_THEME_LISTED ? "<p class=\"lead\">… et " + (n - MAX_THEME_LISTED) + " autres sur Whazup.</p>\n<a class=\"cta\" href=\"" + cta + "\">Tout voir sur Whazup</a>\n" : "");
      const can = SITE + "/" + OUT + "/" + slug + "/" + T.slug + "/";
      write(slug + "/" + T.slug, shell({ title, desc, canonical: can, body, ld: ldList(name, sub, T.label + " à") }));
      urls.push({ u: can, p: "0.6" }); nTheme++;
    }
    E.themes = tp.length;
  }

  // 5. page « toutes les villes »
  const byAlpha = (a, b) => a.name.localeCompare(b.name, "fr");
  const V = ents.filter((x) => x.kind === "ville").sort(byAlpha), C = ents.filter((x) => x.kind === "commune").sort(byAlpha);
  const lis = (l) => "<ul class=\"cities\">\n" + l.map((p) => "<li><a href=\"/" + OUT + "/" + p.slug + "/\">" + esc(p.name) + "</a></li>").join("\n") + "\n</ul>\n";
  fs.writeFileSync(path.join(OUT, "index.html"), shell({
    title: "Sorties en France, ville par ville | Whazup",
    desc: "Concerts, expositions, spectacles, marchés et sorties gratuites dans " + ents.length + " villes et communes de France, mis à jour chaque jour.",
    canonical: SITE + "/" + OUT + "/",
    body: "<h1>Sorties en France, ville par ville</h1>\n<p class=\"lead\">Choisis ta ville pour voir les sorties des prochains jours.</p>\n" + lis(V) +
      (C.length ? "<h2>Autres communes</h2>\n" + lis(C) : "")
  }));

  // 6. plan du site
  const all2 = [{ u: SITE + "/", p: "1.0" }, { u: SITE + "/" + OUT + "/", p: "0.8" }].concat(urls);
  const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
    all2.map((x) => "  <url>\n    <loc>" + x.u + "</loc>\n    <lastmod>" + today + "</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>" + x.p + "</priority>\n  </url>").join("\n") + "\n</urlset>\n";
  fs.writeFileSync("sitemap.xml", xml);
  console.log("pages villes :", V.length, "· communes :", C.length, "· pages principales :", nMain, "· pages ciblées :", nTheme, "· total URLs :", all2.length);
}
main();
