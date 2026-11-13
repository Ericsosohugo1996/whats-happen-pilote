// Robot « Test restaurants à découvrir » : ne modifie RIEN dans l'appli. Lit un échantillon de restaurants dans
// DATAtourisme (clé lue dans le secret, jamais affichée) et compte ceux qui sont « atypiques » (cadre, ambiance,
// adresse cachée) ET qui ont une photo. Écrit un compte rendu + une liste d'exemples dans data/restos-test/.
const fs = require("fs");
const BASE = "https://api.datatourisme.fr";
const KEY = process.env.DATATOURISME_API_KEY || "";
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "80", 10);
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
const ATYP = /(guinguette|p[eé]niche|bateau|ferme[- ]auberge|table d.h[oô]tes|insolite|atypique|rooftop|toit[- ]terrasse|cabane|troglodyt|moulin|ch[aâ]teau|manoir|abbaye|chapelle|prieur[eé]|vignoble|domaine|jardin|verger|panorama|vue (sur|imprenable)|bord de (l.eau|mer|rivi[eè]re|lac|seine|loire)|au bord|en pleine nature|secret|cach[eé]|confidentiel|hors du commun|d[eé]cor|cadre (exceptionnel|magnifique|unique|idyllique|verdoyant|authentique)|ambiance (chaleureuse|intimiste|cosy|conviviale)|maison (de caract[eè]re|ancienne|bourgeoise)|ancien(ne)? (moulin|ferme|grange|couvent|atelier|usine|gare|cin[eé]ma|[eé]glise)|cave vo[uû]t[eé]e|vo[uû]te|grange|phare|[iî]le|falaise|lac\b|plage|sur l.eau)/i;
const BANAL = /(kebab|tacos|burger|pizza|snack|fast.?food|sandwich|cafeteria|cantine|restauration rapide|friterie|d[oö]ner)/i;
(async () => {
  fs.mkdirSync("data/restos-test", { recursive: true });
  if (!KEY) { say("Pas de clé DATAtourisme dans les secrets."); fs.writeFileSync("data/restos-test/_resume.txt", out.join("\n") + "\n"); return; }
  let url = "/v1/placeOfInterest?page_size=100&lang=fr&type=Restaurant", pages = 0, total = 0, ok = 0;
  const cand = [], byCity = {};
  const dump = [];
  let shown = false, withPhoto = 0, withDesc = 0, atyp = 0, atypPhoto = 0, atypPhotoDesc = 0, noCoords = 0;
  while (url && pages < MAX_PAGES) {
    const r = await get(url);
    if (!r.json) { say("Arrêt (HTTP " + r.status + ") : " + String(r.text).slice(0, 160).replace(/\s+/g, " ")); break; }
    for (const o of r.json.objects || []) {
      total++;
      if (!/Restaurant/.test(typesOf(o).join(" "))) continue;
      ok++;
      if (dump.length < 2) dump.push(o);
      if (!shown) { shown = true; say("Exemple de structure (clés) : " + Object.keys(o).join(", ")); say("Types : " + typesOf(o).join(" ")); }
      const title = titleOf(o);
      const desc = descOf(o);
      const city = fr(findKey(o.isLocatedAt, "addressLocality")) || "";
      const lat = parseFloat(findKey(o.isLocatedAt, "latitude")), lng = parseFloat(findKey(o.isLocatedAt, "longitude"));
      const photo = photoOf(o);
      if (isNaN(lat) || isNaN(lng)) noCoords++;
      if (photo) withPhoto++;
      if (desc && desc.length >= 120) withDesc++;
      const hay = title + " " + desc + " " + typesOf(o).join(" ");
      const isAtyp = ATYP.test(hay) && !BANAL.test(title);
      if (isAtyp) { atyp++; if (photo) { atypPhoto++; if (desc.length >= 120) atypPhotoDesc++; } }
      if (isAtyp && photo && desc.length >= 120) {
        byCity[city] = (byCity[city] || 0) + 1;
        if (cand.length < 400) cand.push({ title, city, lat, lng, photo, desc: desc.slice(0, 260), uri: o.uri || "" });
      }
    }
    url = r.json.meta && r.json.meta.next ? r.json.meta.next : "";
    pages++;
    await sleep(1100);
  }
  say("Restaurants lus : " + ok + " (sur " + total + " lieux, " + pages + " pages)");
  say("  avec photo : " + withPhoto + " | avec description ≥ 120 caractères : " + withDesc + " | sans coordonnées : " + noCoords);
  say("  « atypiques » (mots-clés cadre/ambiance/lieu) : " + atyp + " | + photo : " + atypPhoto + " | + photo + description : " + atypPhotoDesc);
  const top = Object.keys(byCity).sort((a, b) => byCity[b] - byCity[a]).slice(0, 20);
  say("Villes avec le plus de candidats : " + top.map((c) => c + " " + byCity[c]).join(", "));
  say("Villes différentes avec au moins 1 candidat : " + Object.keys(byCity).length);
  fs.writeFileSync("data/restos-test/_resume.txt", out.join("\n") + "\n");
  fs.writeFileSync("data/restos-test/_structure.json", JSON.stringify(dump, null, 1).slice(0, 12000));
  fs.writeFileSync("data/restos-test/_exemples.json", JSON.stringify(cand.slice(0, 120), null, 1));
})();
