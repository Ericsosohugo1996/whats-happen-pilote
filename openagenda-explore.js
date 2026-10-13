// Whazup — EXPLORATION OpenAgenda (n'ajoute rien au site).
// Cherche les agendas publics de concerts, soirées, clubs, bars et salles, compte leurs événements à venir
// et écrit openagenda-report.txt + openagenda-agendas.json pour choisir lesquels brancher ensuite.
// La clé est lue dans le secret GitHub OPENAGENDA_KEY (envoyée dans l'en-tête "key", jamais dans l'adresse).
const fs = require("fs");
const KEY = process.env.OPENAGENDA_KEY || "";
const BASE = process.env.OA_BASE || "https://api.openagenda.com/v2";
const REPORT = "openagenda-report.txt", OUT = "openagenda-agendas.json";
const report = [];
const log = (...a) => { const s = a.join(" "); console.log(s); report.push(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TERMS = ["Lyon", "Strasbourg", "Nice", "Montpellier", "Grenoble", "Dijon", "Angers", "Nancy", "Reims", "Tours", "Toulon", "Clermont-Ferrand", "Brest", "Metz", "Le Mans", "Amiens", "Poitiers", "Saint-Étienne", "Caen", "Le Havre", "Nîmes", "Avignon", "Perpignan", "Besançon", "Orléans", "Mulhouse", "Rouen", "Limoges", "Pau", "Bayonne", "Annecy", "Chambéry", "La Rochelle", "Cannes", "Antibes", "Dunkerque", "Calais", "Poitiers", "Troyes", "Valence", "Colmar", "Lorient", "Quimper", "Vannes", "théâtre", "humour", "comédie", "zénith", "scène nationale", "opéra", "cirque", "danse", "sport", "sorties", "agenda sorties ville"];

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
const txt = (v) => (v && typeof v === "object" ? v.fr || v.en || Object.values(v)[0] : v) || "";

(async () => {
  if (!KEY) { log("Pas de clé OPENAGENDA_KEY."); fs.writeFileSync(REPORT, report.join("\n") + "\n"); return; }
  const agendas = new Map();
  for (const term of TERMS) {
    let after = null;
    for (let page = 0; page < 3; page++) {
      const p = [["search", term], ["size", "100"], ["includeFields[]", "uid"], ["includeFields[]", "title"], ["includeFields[]", "slug"], ["includeFields[]", "official"]];
      if (after) for (const a of after) p.push(["after[]", a]);
      const r = await api("/agendas", p);
      await sleep(200);
      if (r.error) { log("Erreur recherche", term, r.error); break; }
      for (const a of r.json.agendas || []) if (!agendas.has(a.uid)) agendas.set(a.uid, { uid: a.uid, title: txt(a.title), slug: a.slug, official: !!a.official, terms: [term] });
      after = r.json.after;
      if (!after || !(r.json.agendas || []).length) break;
    }
    log("Recherche « " + term + " » → total agendas distincts :", agendas.size);
  }
  const now = new Date(), end = new Date(now.getTime() + 60 * 86400000);
  const rows = [];
  let n = 0, errs = 0;
  for (const a of agendas.values()) {
    n++;
    const r = await api("/agendas/" + a.uid + "/events", [["relative[]", "upcoming"], ["timings[lte]", end.toISOString()], ["size", "3"], ["detailed", "1"], ["monolingual", "fr"]]);
    await sleep(200);
    if (r.error) { errs++; continue; }
    const total = r.json.total || 0;
    if (!total) continue;
    const ev = (r.json.events || [])[0] || {};
    const loc = ev.location || {};
    rows.push({ uid: a.uid, title: a.title, slug: a.slug, official: a.official, total, city: txt(loc.city) || "", sample: txt(ev.title).slice(0, 60), lat: loc.latitude || null, lng: loc.longitude || null });
  }
  rows.sort((x, y) => y.total - x.total);
  log("Agendas examinés :", n, "— erreurs :", errs, "— agendas avec événements à venir (60 jours) :", rows.length);
  log("Total d'événements à venir dans ces agendas :", rows.reduce((s, r) => s + r.total, 0));
  log("");
  log("TOP 500 agendas (événements à venir sous 60 jours) :");
  for (const r of rows.slice(0, 500)) log(String(r.total).padStart(5), "|", r.uid, "|", r.title.slice(0, 50), "|", r.city, "| ex. :", r.sample);
  fs.writeFileSync(OUT, JSON.stringify(rows));
  fs.writeFileSync(REPORT, report.join("\n") + "\n");
})();
