// Robot « Adresses de caractère » : construit data/restos-caractere.json (une sélection, pas un annuaire). Lit un échantillon de restaurants dans
// DATAtourisme (clé lue dans le secret, jamais affichée) et compte ceux qui sont « atypiques » (cadre, ambiance,
// adresse cachée) ET qui ont une photo. Écrit un compte rendu + une liste d'exemples dans data/restos-test/.
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
// Critères stricts : un cadre, un lieu, une ambiance qui sortent de l'ordinaire. Les chaînes, hôtels et « groupes » sont écartés.
const STRONG = /(guinguette|p[eé]niche|ferme[- ]auberge|table d.h[oô]tes|insolite|atypique|rooftop|toit[- ]terrasse|cabane|troglodyt|moulin|ch[aâ]teau|manoir|abbaye|chapelle|prieur[eé]|bastide|grange|phare|vue imprenable|vue panoramique|au bord (de l.eau|du lac|du canal|de la rivi[eè]re|de la mer)|fortifi|si[eè]cle|tentes? |ancienne? (ferme|moulin|grange|couvent|usine|gare|cin[eé]ma|atelier|[eé]glise|bergerie|chapelle|maison)|cave vo[uû]t[eé]e|pierres? apparentes?|poutres|jardin secret|secret|cach[eé]|hors du commun|au c[oœ]ur d.un (parc|jardin|verger|vignoble))/i;
const BANAL = /(kebab|tacos|burger|pizza|snack|fast.?food|sandwich|cafeteria|cantine|restauration rapide|friterie|d[oö]ner|h[oô]tel|campanile|balladins|kyriad|ibis|mercure|au bureau|buffalo|hippopotamus|flunch|courtepaille|domino|mcdo|logis|camping|village vacances|\(groupes?\)|traiteur|livraison|[aà] emporter)/i;
const HOTELISH = /(chambres?|h[oô]tel|\bspa\b|s[ée]minaires?|mariages?|r[ée]ceptions?|banquets?|gîte|camping|r[ée]sidence)/i;
const PLUS = /(guinguette|insolite|atypique|secret|cach[eé]|cabane|p[eé]niche|ferme[- ]auberge|troglodyt|bastide|ancienne? (ferme|moulin|grange|couvent|usine|gare|cin[eé]ma|atelier|bergerie)|vue imprenable|pieds dans l.eau|hors du commun|d[eé]cor (unique|original))/gi;
function score(title, desc) {
  let s = 0, m = (title + " " + desc).match(PLUS); if (m) s += 2 * Math.min(m.length, 3);
  const st = (title + " " + desc).match(new RegExp(STRONG.source, "gi")); if (st) s += Math.min(st.length, 4);
  if (HOTELISH.test(desc)) s -= 3;
  if (desc.length > 220) s += 1;
  return s;
}
// « genre » de l'adresse, à la manière d'un guide : une étiquette courte et vraie, tirée du texte
const KINDS = [[/guinguette/i, "Guinguette"], [/p[eé]niche|bateau/i, "Sur l'eau"], [/ferme[- ]auberge/i, "Ferme-auberge"], [/table d.h[oô]tes/i, "Table d'hôtes"], [/cabane/i, "Cabane"], [/troglodyt|cave vo[uû]t[eé]e/i, "Dans une cave"], [/bastide/i, "Bastide"], [/ch[aâ]teau|manoir/i, "Château"], [/moulin/i, "Ancien moulin"], [/ancienne? (ferme|grange|bergerie|couvent|usine|gare|cin[eé]ma|atelier)/i, "Lieu transformé"], [/rooftop|toit[- ]terrasse/i, "Sur les toits"], [/insolite|atypique/i, "Lieu insolite"], [/secret|cach[eé]/i, "Adresse secrète"], [/vue (imprenable|panoramique)|panorama/i, "Avec vue"], [/au bord (de l.eau|du lac|du canal|de la mer|de la rivi[eè]re)|pieds dans l.eau/i, "Au bord de l'eau"]];
function kindOf(text) { for (const [re, k] of KINDS) if (re.test(text)) return k; return "Adresse de caractère"; }
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
(async () => {
  if (!KEY) { say("Pas de clé DATAtourisme."); return; }
  const OUT = "data/restos-caractere.json", PER_CITY = 3, TOTAL = 1000, MIN = 4;
  let url = "/v1/placeOfInterest?page_size=100&lang=fr&type=Restaurant", pages = 0; const cand = [];
  while (url && pages < 500) {
    const r = await get(url);
    if (!r.json) { say("Arrêt (HTTP " + r.status + ")"); break; }
    for (const o of r.json.objects || []) {
      if (!/Restaurant/.test(typesOf(o).join(" "))) continue;
      const title = titleOf(o), desc = descOf(o), photo = photoOf(o);
      const lat = parseFloat(findKey(o.isLocatedAt, "latitude")), lng = parseFloat(findKey(o.isLocatedAt, "longitude"));
      const city = fr(findKey(o.isLocatedAt, "addressLocality")) || "";
      if (!title || !photo || desc.length < 120 || isNaN(lat) || isNaN(lng) || !city) continue;
      if (BANAL.test(title) || /(groupes?)/i.test(title) || !STRONG.test(title + " " + desc)) continue;
      const s = score(title, desc); if (s < MIN) continue;
      cand.push({ s, id: "resto-" + hash(o.uri || title + city), t: title.replace(/\s+/g, " ").trim(), c: city, la: +lat.toFixed(5), lo: +lng.toFixed(5), p: photo, d: desc.replace(/\s+/g, " ").trim().slice(0, 240), k: kindOf(title + " " + desc), sc: s, u: o.uri || "" });
    }
    url = r.json.meta && r.json.meta.next ? r.json.meta.next : ""; pages++; await sleep(1100);
  }
  cand.sort((a, b) => b.s - a.s);
  const per = {}, keep = [];
  for (const c of cand) { per[c.c] = (per[c.c] || 0) + 1; if (per[c.c] <= PER_CITY && keep.length < TOTAL) keep.push(c); }
  say("Adresses de caractère : " + cand.length + " retenues par le score, " + keep.length + " gardées (max " + PER_CITY + " par ville), " + Object.keys(per).length + " villes");
  if (keep.length < 200) { say("Trop peu d'adresses : fichier non écrasé."); fs.writeFileSync("data/restos-test/_build-resume.txt", out.join("\n") + "\n"); return; }
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(keep.map(({ s, ...x }) => x)));
  fs.mkdirSync("data/restos-test", { recursive: true });
  fs.writeFileSync("data/restos-test/_build-resume.txt", out.join("\n") + "\n");
  // un échantillon lisible (une adresse sur ~16, dans l'ordre) pour contrôler la qualité à l'œil
  const step = Math.max(1, Math.floor(keep.length / 40)), samp = [];
  for (let i = 0; i < keep.length && samp.length < 40; i += step) { const x = keep[i]; samp.push((samp.length + 1) + ". " + x.t + " | " + x.c + " | " + (x.k || "") + " | photo " + (x.p ? "oui" : "non") + "\n   " + String(x.d || "").slice(0, 160)); }
  fs.writeFileSync("data/restos-test/_echantillon.txt", samp.join("\n") + "\n");
})();
