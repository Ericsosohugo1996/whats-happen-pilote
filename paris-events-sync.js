// Whazup — événements officiels de la Ville de Paris (« Que faire à Paris ? », données ouvertes, licence ODbL).
// Lancé chaque jour par .github/workflows/paris-events.yml. Écrit paris-events.json (même format que datatourisme-events.json).
// Source : https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/  — © Ville de Paris
const fs = require("fs");

const OUT = "paris-events.json";
const REPORT = "paris-events-report.txt";
const DAYS_AHEAD = 60;
const API = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/exports/json";
const report = [];
const log = (...a) => { const s = a.join(" "); console.log(s); report.push(s); };

function parisNow() {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date());
  return p.replace(" ", "T"); // 2026-10-10T21:44
}
const NOW = parisNow(), TODAY = NOW.slice(0, 10);
function addDays(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const LIMIT = addDays(TODAY, DAYS_AHEAD);
function parisParts(s) { // "2026-10-10T20:00:00+02:00" -> {date, time} en heure de Paris
  const d = new Date(s); if (isNaN(d)) return null;
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  return { date: p.slice(0, 10), time: p.slice(11, 16) };
}
function strip(h) {
  return String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// choisit la prochaine date où l'événement a lieu
function pickDate(r) {
  const occ = String(r.occurrences || "");
  if (occ) {
    for (const part of occ.split(";")) {
      const [a, b] = part.split("_");
      const s = parisParts(a), e = parisParts(b || a);
      if (!s || !e) continue;
      if (e.date + "T" + e.time < NOW) continue; // déjà terminée
      if (s.date > LIMIT) continue;
      const date = s.date > TODAY ? s.date : TODAY;
      const time = date === s.date && s.time >= "06:00" ? s.time : "";
      return { date, time, end: e.date };
    }
    if (occ.includes("_")) return null; // occurrences connues mais aucune à venir dans la fenêtre
  }
  const s = parisParts(r.date_start), e = parisParts(r.date_end || r.date_start);
  if (!s) return null;
  if (e && e.date < TODAY) return null;
  if (s.date > LIMIT) return null;
  const date = s.date > TODAY ? s.date : TODAY;
  return { date, time: date === s.date && s.time >= "06:00" ? s.time : "", end: e ? e.date : s.date };
}

function classify(r) {
  const tags = Array.isArray(r.tags) ? r.tags.join(" ") : String(r.tags || "");
  const t = fold(tags + " " + (r.title || "") + " " + (r.qfap_tags || "") + " " + (r.category || ""));
  if (/brocante|vide[- ]grenier|puces/.test(t)) return ["marche", "Brocante"];
  if (/\bmarche\b/.test(t)) return ["marche", "Marché"];
  if (/sport|course|marathon|football|rugby|tennis|natation|basket|cyclis|yoga|fitness/.test(t)) return ["sport", "Sport"];
  if (/\b(concerts?|musiques?|jazz|opera|rock|rap|hip-hop|dj set|electro|chansons?|orchestre|recital|symphoni)/.test(t)) return ["musique", "Musique"];
  if (/exposition|expo\b|musee|galerie|photograph|vernissage|art contemporain/.test(t)) return ["expo", "Expo"];
  if (/soiree|nightlife|club|bar\b|afterwork|fete\b/.test(t)) return ["village", "Soirée"];
  return ["festival", "Festival"];
}

function priceOf(r) {
  const type = fold(r.price_type), det = strip(r.price_detail);
  if (type.includes("gratuit")) return type.includes("condition") ? "Gratuit sous conditions" : "Gratuit";
  if (type.includes("payant")) return det ? ("Payant · " + det).slice(0, 80) : "Payant";
  return "Voir sur place";
}

function placeOf(r) {
  const bits = [r.address_name, r.address_street, [r.address_zipcode, r.address_city].filter(Boolean).join(" ")].map((x) => String(x || "").trim()).filter(Boolean);
  return bits.join(", ");
}
function latlon(r) {
  const ll = r.lat_lon;
  if (ll && typeof ll === "object" && ll.lat != null) return [Number(ll.lat), Number(ll.lon != null ? ll.lon : ll.lng)];
  if (typeof ll === "string" && ll.includes(",")) { const [a, b] = ll.split(",").map(Number); return [a, b]; }
  if (r.lat != null && r.lon != null) return [Number(r.lat), Number(r.lon)];
  return [NaN, NaN];
}

(async () => {
  let prev = {};
  try { for (const e of JSON.parse(fs.readFileSync(OUT, "utf8"))) prev[e.id] = e.createdAt; } catch (e) {}
  const where = `date_end >= date'${TODAY}' AND date_start <= date'${LIMIT}'`;
  const url = API + "?limit=-1&timezone=Europe%2FParis&where=" + encodeURIComponent(where);
  log("Date (Paris) :", NOW, "— fenêtre :", TODAY, "→", LIMIT);
  let rows;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "whazup-sync/1.0 (+https://whazup.fr)" } });
    log("HTTP", res.status);
    if (!res.ok) throw new Error("HTTP " + res.status);
    rows = await res.json();
  } catch (e) {
    log("ERREUR de téléchargement :", e.message, "— on garde l'ancien fichier");
    fs.writeFileSync(REPORT, report.join("\n") + "\n");
    return;
  }
  if (!Array.isArray(rows)) { log("Format inattendu"); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  log("Lignes reçues :", rows.length);
  if (rows[0]) log("Champs :", Object.keys(rows[0]).join(", "));
  const stats = { sansPosition: 0, horsFenetre: 0, ok: 0 };
  const out = [], seen = new Set();
  for (const r of rows) {
    const [lat, lng] = latlon(r);
    if (!isFinite(lat) || !isFinite(lng)) { stats.sansPosition++; continue; }
    const d = pickDate(r);
    if (!d) { stats.horsFenetre++; continue; }
    const title = strip(r.title);
    if (!title) continue;
    const key = fold(title) + "|" + d.date + "|" + lat.toFixed(3);
    if (seen.has(key)) continue; seen.add(key);
    const [scene, category] = classify(r);
    const id = "pq-" + (r.id != null ? r.id : fold(title).replace(/[^a-z0-9]+/g, "-")) + "-" + d.date;
    const ev = {
      id, scene, city: "paris", category, title, date: d.date, time: d.time,
      place: placeOf(r), lat, lng, price: priceOf(r), thumb: "", source: "paris-opendata",
      createdAt: prev[id] || Date.now(),
      description: strip(r.lead_text || r.description).slice(0, 400),
    };
    // expo / événement sur plusieurs jours : on garde la date de fin, l'appli l'affiche chaque jour jusqu'à cette date
    if (d.end && d.end > d.date) ev.dateEnd = d.end;
    if (r.url) ev.link = r.url;
    if (r.cover_url) { ev.photo = r.cover_url; if (r.cover_credit) ev.photoCredit = strip(r.cover_credit).slice(0, 80); }
    out.push(ev); stats.ok++;
  }
  out.sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  log("Résultat :", JSON.stringify(stats));
  const by = {}; for (const e of out) by[e.category] = (by[e.category] || 0) + 1;
  log("Par catégorie :", JSON.stringify(by));
  log("Gratuits :", out.filter((e) => /^Gratuit/.test(e.price)).length, "— avec photo :", out.filter((e) => e.photo).length);
  if (out.length < 50) { log("Trop peu d'événements : on garde l'ancien fichier"); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  fs.writeFileSync(OUT, JSON.stringify(out));
  fs.writeFileSync(REPORT, report.join("\n") + "\n");
})();
