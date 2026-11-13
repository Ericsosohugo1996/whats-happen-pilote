// Robot « Perles de Paris » : prend la liste choisie à la main (data/perles-paris-seed.json), retrouve chaque lieu sur
// OpenStreetMap (coordonnées + preuve que le lieu existe), cherche une photo LIBRE sur Wikimedia Commons (auteur + licence),
// et écrit data/perles-paris.json (seulement les lieux retrouvés) + data/perles-test/_rapport-paris.txt (tout le détail).
const fs = require("fs");
const UA = "Whazup/1.0 (whazup.contact@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BBOX = { s: 48.76, n: 48.95, w: 2.2, e: 2.5 };
const inParis = (la, lo) => la >= BBOX.s && la <= BBOX.n && lo >= BBOX.w && lo <= BBOX.e;
const out = [];
const say = (s) => { console.log(s); out.push(s); };
async function getJson(url, tries) {
  for (let i = 0; i < (tries || 3); i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.status === 429 || r.status >= 500) { await sleep(3000 * (i + 1)); continue; }
      return await r.json();
    } catch (e) { await sleep(2000 * (i + 1)); }
  }
  return null;
}
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ");
const STOP = new Set(["le", "la", "les", "de", "des", "du", "au", "aux", "et", "en", "paris", "cafe", "restaurant", "musee", "bar", "chez", "the", "sur", "dans", "un", "une"]);
const tokens = (s) => norm(s).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const shares = (title, text) => { const t = tokens(title), x = " " + norm(text) + " "; return t.length ? t.some((w) => x.indexOf(" " + w) >= 0) : true; };

// 1) OpenStreetMap (Nominatim) — 1 requête par seconde, comme demandé par leur règle d'usage
async function osmQuery(q) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&extratags=1&countrycodes=fr&bounded=1" +
    "&viewbox=" + BBOX.w + "," + BBOX.n + "," + BBOX.e + "," + BBOX.s + "&q=" + encodeURIComponent(q);
  const j = await getJson(url);
  await sleep(1100);
  return Array.isArray(j) ? j.map((x) => ({ x, la: +x.lat, lo: +x.lon })).filter((h) => inParis(h.la, h.lo)) : [];
}
const dist = (a, b) => { const R = 6371000, r = Math.PI / 180, dLa = (b.la - a.la) * r, dLo = (b.lo - a.lo) * r; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.la * r) * Math.cos(b.la * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
// le nom du lieu trouvé doit vraiment ressembler au titre (pas un seul mot en commun par hasard)
function sameName(title, found) {
  const t = tokens(title), f = " " + norm(found) + " ";
  if (!t.length) return true;
  if (t.length === 1) return f.indexOf(" " + t[0] + " ") >= 0 && f.trim().split(/\s+/).length <= 4;
  const n = t.filter((w) => f.indexOf(" " + w) >= 0).length;
  return n >= Math.min(2, t.length) && n >= Math.ceil(t.length * 0.6);
}
const isPoi = (h) => !/^(highway|place|boundary|landuse|natural)$/.test(h.x.category || h.x.class);
async function osm(item) {
  const short = item.t.replace(/ - .*/, "").replace(/\s*\?$/, "");
  let poi = null, adr = null, note = "";
  // 1) par le nom : si OpenStreetMap connaît le lieu, c'est la meilleure preuve qu'il existe
  const byName = await osmQuery(short + " Paris");
  const hp = byName.find((h) => isPoi(h) && sameName(short, h.x.name || ""));
  if (hp) poi = { la: hp.la, lo: hp.lo, tags: hp.x.extratags || {} };
  // 2) par l'adresse donnée (si elle commence par un numéro de rue)
  if (/^\d/.test(item.q)) {
    const num = item.q.match(/^\d+\w*/)[0].toLowerCase();
    const byAdr = await osmQuery(item.q);
    const best = byAdr.find((h) => /house|building|yes|residential|commercial|apartments/.test(h.x.type || "") || h.x.addresstype === "building") ||
      byAdr.find((h) => String(h.x.display_name || "").toLowerCase().startsWith(num + ",")) || byAdr[0];
    if (best) adr = { la: best.la, lo: best.lo, tags: best.x.extratags || {} };
  } else if (!poi && item.q !== short + " Paris") {
    const byQ = await osmQuery(item.q);
    const p2 = byQ.find((h) => isPoi(h) && sameName(short, h.x.name || ""));
    if (p2) poi = { la: p2.la, lo: p2.lo, tags: p2.x.extratags || {} };
  }
  if (poi && adr && dist(poi, adr) > 700) { note = "conflit : le lieu trouvé est à " + Math.round(dist(poi, adr)) + " m de l'adresse donnée, on garde l'adresse"; poi = null; }
  if (poi) return { kind: "lieu", la: poi.la, lo: poi.lo, tags: poi.tags, note };
  if (adr) return { kind: "adresse", la: adr.la, lo: adr.lo, tags: adr.tags, note };
  return null;
}

// 2) Wikimedia Commons : photo libre + crédit
const strip = (h) => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const FREE = /(^|\W)(cc[ -]?by|cc0|public domain|pd)(\W|$)/i;
async function imgInfo(fileTitle) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=900&titles=" + encodeURIComponent(fileTitle);
  const j = await getJson(u); await sleep(300);
  const pages = j && j.query && j.query.pages; if (!pages) return null;
  const p = pages[Object.keys(pages)[0]]; const ii = p && p.imageinfo && p.imageinfo[0]; if (!ii) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(ii.mime || "")) return null;
  if ((ii.width || 0) < 600) return null;
  const m = ii.extmetadata || {};
  const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
  const art = strip(m.Artist && m.Artist.value);
  if (!lic || !FREE.test(lic)) return null;                 // licence non libre : on n'utilise pas
  if (/fair use|noncommercial|nc/i.test(lic)) return null;
  if (!art && !/cc0|public domain|pd/i.test(lic)) return null; // auteur introuvable : on n'utilise pas
  return { url: ii.thumburl || ii.url, page: ii.descriptionurl, lic, art: art || "domaine public", title: fileTitle };
}
async function fromCategory(cat) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=categorymembers&cmtype=file&cmlimit=12&cmtitle=" + encodeURIComponent(cat);
  const j = await getJson(u); await sleep(300);
  for (const f of ((j && j.query && j.query.categorymembers) || [])) { const r = await imgInfo(f.title); if (r) return r; }
  return null;
}
async function fromWikidata(q) {
  const u = "https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&origin=*&property=P18&entity=" + encodeURIComponent(q);
  const j = await getJson(u); await sleep(300);
  const c = j && j.claims && j.claims.P18 && j.claims.P18[0]; const v = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
  return v ? imgInfo("File:" + v) : null;
}
const BAD = /(15|16|17|18)\d\d|19[0-8]\d|btv|bpt|\(\d+ of \d+\)|estampe|gravure|dessin|\bMET\b|painting|tableau|gallica|affiche/i;
// photos géolocalisées à moins de 120 m du lieu et dont le nom de fichier contient un mot du lieu : très fiable
async function fromGeo(item, o) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=geosearch&gsnamespace=6&gsradius=120&gslimit=40&gscoord=" + o.la + "%7C" + o.lo;
  const j = await getJson(u); await sleep(300);
  const short = item.t.replace(/ - .*/, "");
  for (const f of ((j && j.query && j.query.geosearch) || [])) {
    if (!/\.jpe?g$/i.test(f.title) || BAD.test(f.title)) continue;
    if (!shares(short, f.title)) continue;
    const r = await imgInfo(f.title); if (r) return r;
  }
  return null;
}
// candidat par recherche de nom : jamais utilisé tel quel, seulement proposé pour contrôle
async function candidate(item) {
  const short = item.t.replace(/ - .*/, ""), t = tokens(short);
  if (t.length < 2) return null;
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srnamespace=6&srlimit=8&srsearch=" + encodeURIComponent(short + " Paris");
  const j = await getJson(u); await sleep(300);
  for (const f of ((j && j.query && j.query.search) || [])) {
    if (!/\.jpe?g$/i.test(f.title) || BAD.test(f.title)) continue;
    const x = " " + norm(f.title) + " ";
    if (!t.every((w) => x.indexOf(" " + w) >= 0)) continue;
    const r = await imgInfo(f.title); if (r) return r;
  }
  return null;
}
async function photo(item, o) {
  const t = (o && o.tags) || {};
  try {
    if (o.kind === "lieu") {
      if (t.wikimedia_commons) { const c = t.wikimedia_commons; const r = /^Category:/i.test(c) ? await fromCategory(c) : await imgInfo(c); if (r && !BAD.test(r.title)) return { strong: r }; }
      if (t.image && /commons\.wikimedia\.org\/wiki\/File:/.test(t.image)) { const r = await imgInfo(decodeURIComponent(t.image.split("/wiki/")[1])); if (r && !BAD.test(r.title)) return { strong: r }; }
      if (t.wikidata) { const r = await fromWikidata(t.wikidata); if (r && !BAD.test(r.title)) return { strong: r }; }
    }
    const g = await fromGeo(item, o); if (g) return { strong: g };
  } catch (e) {}
  try { const c = await candidate(item); if (c) return { cand: c }; } catch (e) {}
  return {};
}

(async () => {
  const seed = JSON.parse(fs.readFileSync("data/perles-paris-seed.json", "utf8"));
  say("Perles de Paris : " + seed.length + " adresses à vérifier");
  const ok = [], lost = [];
  let withPhoto = 0, poiCount = 0;
  const cands = [];
  for (const it of seed) {
    const o = await osm(it);
    if (!o) { lost.push(it); say("✗ introuvable : " + it.t + "  (" + it.q + ")"); continue; }
    const ph = await photo(it, o);
    const st = ph.strong || null;
    if (o.kind === "lieu") poiCount++;
    if (st) withPhoto++;
    if (!st && ph.cand) cands.push(it.t + " : " + ph.cand.page);
    ok.push({
      id: it.id, t: it.t, c: "Paris", la: +o.la.toFixed(6), lo: +o.lo.toFixed(6), k: it.k, e: it.e, d: it.d,
      p: st ? st.url : "", cr: st ? "Photo : " + st.art + " · " + st.lic + " · Wikimedia Commons" : "", cu: st ? st.page : "",
      s: o.kind, v: it.v
    });
    say("✓ " + it.t + " [" + o.kind + (it.v ? "" : " · source ancienne") + "] " + (st ? "photo fiable " + st.page : ph.cand ? "sans photo fiable (candidate à regarder : " + ph.cand.page + ")" : "sans photo") + (o.note ? "  ⚠ " + o.note : ""));
  }
  if (cands.length) { say(""); say("Photos candidates (non utilisées, à regarder à la main) :"); cands.forEach((c) => say("  - " + c)); }
  say("");
  say("RÉSUMÉ : " + ok.length + " retrouvés sur " + seed.length + " (dont " + poiCount + " confirmés comme lieu par OpenStreetMap, " + (ok.length - poiCount) + " seulement par leur adresse)");
  say("Photos libres trouvées : " + withPhoto + " / " + ok.length);
  say("Introuvables (écartés) : " + lost.length);
  lost.forEach((l) => say("  - " + l.t + " : " + l.q));
  if (ok.length < 20) { say("Trop peu de résultats : le fichier final n'est pas écrit (OpenStreetMap est peut-être saturé, relance plus tard)."); fs.mkdirSync("data/perles-test", { recursive: true }); fs.writeFileSync("data/perles-test/_rapport-paris.txt", out.join("\n")); return; }
  fs.mkdirSync("data/perles-test", { recursive: true });
  fs.writeFileSync("data/perles-paris.json", JSON.stringify(ok));
  fs.writeFileSync("data/perles-test/_rapport-paris.txt", out.join("\n"));
})();
