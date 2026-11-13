// Robot « Bars de caractère » : construit data/bars-caractere.json (bars à cocktails, caves à vins, bars cachés, péniches, rooftops, clubs de caractère) à partir de DATAtourisme.
// Sélection, pas un annuaire : il faut un signe fort de caractère ET une photo. Clé lue dans le secret, jamais affichée.
const fs = require("fs");
const BASE = "https://api.datatourisme.fr";
const KEY = process.env.DATATOURISME_API_KEY || "";
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "400", 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const say = (s) => { console.log(s); out.push(s); };
async function get(p) {
  const r = await fetch(/^https?:/.test(p) ? p : BASE + p, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  return { status: r.status, json: j, text: t };
}
const typesOf = (o) => [].concat(o.type || o["@type"] || o.types || []).map(String);
// lit une valeur multilingue (fr en priorité) n'importe où dans la structure
function fr(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(fr).filter(Boolean)[0] || "";
  if (typeof v === "object") { if (v.fr) return fr(v.fr); const k = Object.keys(v).filter((x) => !/^@/.test(x))[0]; return k ? fr(v[k]) : ""; }
  return "";
}
function findKey(o, key, depth) {
  if (!o || typeof o !== "object" || (depth || 0) > 6) return undefined;
  if (Array.isArray(o)) { for (const x of o) { const r = findKey(x, key, (depth || 0) + 1); if (r !== undefined) return r; } return undefined; }
  if (key in o) return o[key];
  for (const k of Object.keys(o)) { const r = findKey(o[k], key, (depth || 0) + 1); if (r !== undefined) return r; }
  return undefined;
}
function photoOf(o) {
  const s = JSON.stringify(o.hasMainRepresentation || o.hasRepresentation || "");
  const m = s.match(/https?:\\?\/\\?\/[^"\\]+?\.(?:jpe?g|png|webp)/i) || s.match(/https?:\\?\/\\?\/[^"\\]+/);
  return m ? m[0].replace(/\\\//g, "/") : "";
}
// parcourt toute la structure : renvoie les textes (chemin, valeur)
function leaves(o, path, acc, depth) {
  depth = depth || 0; acc = acc || [];
  if (depth > 9 || o == null) return acc;
  if (typeof o === "string") { acc.push([path, o]); return acc; }
  if (Array.isArray(o)) { o.forEach((x) => leaves(x, path, acc, depth + 1)); return acc; }
  if (typeof o === "object") Object.keys(o).forEach((k) => leaves(o[k], path + "/" + k, acc, depth + 1));
  return acc;
}
function titleOf(o) { const l = leaves(o.label, "label"); return (l[0] || ["", ""])[1] || fr(o.label); }
function descOf(o) {
  const l = leaves(o.hasDescription || {}, "d").filter((x) => !/short/i.test(x[0]) && !/^https?:/.test(x[1]));
  l.sort((a, b) => b[1].length - a[1].length);
  return l[0] ? l[0][1] : "";
}
const CORE = /(speakeasy|bar cach[eé]|cach[eé]|secret|derri[eè]re (une|la|le)|p[eé]niche|bateau|rooftop|toit[- ]terrasse|cave vo[uû]t[eé]e|cave|troglodyt|insolite|atypique|hors du commun|cabane|guinguette|ancienne? (ferme|moulin|grange|couvent|usine|gare|cin[eé]ma|atelier|[eé]glise|bergerie|chapelle|maison|banque|prison|imprimerie|brasserie)|ch[aâ]teau|manoir|abbaye|chapelle|moulin|phare|fortifi|cocktails? (d.auteur|signature|maison|cr[eé]atifs?)|mixolog|bar [aà] vins|vignerons?|vins? nature|jazz|live music|concerts?)/i;
const BANAL = /(pmu|tabac|sports? bar|karaok[eé]|bowling|casino|kebab|burger|pizza|snack|fast.?food|sandwich|friterie|h[oô]tel|campanile|ibis|mercure|au bureau|buffalo|flunch|logis|camping|village vacances|\(groupes?\)|traiteur|livraison|billard|jeux vid[eé]o|shisha|chicha|strip|cabaret de nuit|libertin|coffee|tea room)/i;
const HOTELISH = /(chambres?|\bspa\b|s[ée]minaires?|mariages?|gîte|camping|r[ée]sidence|h[ée]bergement)/i;
const PLUS = /(speakeasy|cach[eé]|secret|p[eé]niche|rooftop|toit[- ]terrasse|cave vo[uû]t[eé]e|insolite|atypique|hors du commun|mixolog|cocktails? (d.auteur|signature|maison)|vins? nature|bar [aà] vins|jazz|d[eé]cor (unique|original)|ancienne? (usine|gare|cin[eé]ma|banque|prison|imprimerie|chapelle|[eé]glise))/gi;
function score(title, desc) {
  let s = 0; const m = (title + " " + desc).match(PLUS); if (m) s += 2 * Math.min(m.length, 3);
  const st = (title + " " + desc).match(new RegExp(CORE.source, "gi")); if (st) s += Math.min(st.length, 4);
  if (HOTELISH.test(desc)) s -= 3;
  if (desc.length > 220) s += 1;
  return s;
}
const KINDS = [[/speakeasy|bar cach[eé]|secret|cach[eé]/i, "Bar caché"], [/p[eé]niche|bateau/i, "Bar sur l'eau"], [/rooftop|toit[- ]terrasse/i, "Sur les toits"], [/bar [aà] vins|vins? nature|cave|vignerons?/i, "Cave à vins"], [/cocktails?|mixolog/i, "Bar à cocktails"], [/jazz|live music|concerts?/i, "Bar musical"], [/guinguette/i, "Guinguette"], [/troglodyt|cave vo[uû]t[eé]e/i, "Dans une cave"], [/ancienne? (usine|gare|cin[eé]ma|banque|prison|imprimerie|chapelle|[eé]glise|ferme|grange|moulin)/i, "Lieu transformé"], [/insolite|atypique/i, "Lieu insolite"], [/discoth[eè]que|club|night/i, "Club"]];
function kindOf(text) { for (const [re, k] of KINDS) if (re.test(text)) return k; return "Bar de caractère"; }
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
(async () => {
  if (!KEY) { say("Pas de clé DATAtourisme."); return; }
  const OUT = "data/bars-caractere.json", MIN = 3, cand = [], seen = {};
  for (const T of ["BarOrPub", "NightClub"]) {
    let url = "/v1/placeOfInterest?page_size=100&lang=fr&type=" + T, pages = 0, total = 0;
    while (url && pages < 300) {
      const r = await get(url);
      if (!r.json) { say("Type " + T + " : arrêt (HTTP " + r.status + ")"); break; }
      for (const o of r.json.objects || []) {
        total++;
        const title = titleOf(o), desc = descOf(o), photo = photoOf(o);
        const lat = parseFloat(findKey(o.isLocatedAt, "latitude")), lng = parseFloat(findKey(o.isLocatedAt, "longitude"));
        const city = fr(findKey(o.isLocatedAt, "addressLocality")) || "";
        if (!title || !photo || desc.length < 100 || isNaN(lat) || isNaN(lng) || !city) continue;
        if (BANAL.test(title) || /(groupes?)/i.test(title) || !CORE.test(title + " " + desc)) continue;
        const s = score(title, desc); if (s < MIN) continue;
        const id = "bar-" + hash(o.uri || title + city); if (seen[id]) continue; seen[id] = 1;
        cand.push({ s, id, t: title.replace(/\s+/g, " ").trim(), c: city, la: +lat.toFixed(5), lo: +lng.toFixed(5), p: photo, d: desc.replace(/\s+/g, " ").trim().slice(0, 240), k: (kindOf(title) !== "Bar de caractère" ? kindOf(title) : kindOf(desc)), sc: s, u: o.uri || "" });
      }
      url = r.json.meta && r.json.meta.next ? r.json.meta.next : ""; pages++; await sleep(1100);
    }
    say("Type " + T + " : " + total + " fiches lues");
  }
  cand.sort((a, b) => b.s - a.s);
  const cities = {}; cand.forEach((c) => { cities[c.c] = 1; });
  say("Bars de caractère : " + cand.length + " retenus, " + Object.keys(cities).length + " villes");
  fs.mkdirSync("data/bars-test", { recursive: true });
  if (cand.length < 20) { say("Trop peu de bars : fichier non écrasé."); fs.writeFileSync("data/bars-test/_build-resume.txt", out.join("\n") + "\n"); return; }
  fs.writeFileSync(OUT, JSON.stringify(cand.map(({ s, ...x }) => x)));
  fs.writeFileSync("data/bars-test/_build-resume.txt", out.join("\n") + "\n");
  const step = Math.max(1, Math.floor(cand.length / 40)), samp = [];
  for (let i = 0; i < cand.length && samp.length < 40; i += step) { const x = cand[i]; samp.push((samp.length + 1) + ". " + x.t + " | " + x.c + " | " + (x.k || "") + "\n   " + String(x.d || "").slice(0, 160)); }
  fs.writeFileSync("data/bars-test/_echantillon.txt", samp.join("\n") + "\n");
})();
