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
async function osm(item) {
  const short = item.t.replace(/ - .*/, "").replace(/\s*\?$/, "");
  // 1) par le nom : si OpenStreetMap connaît le lieu, c'est la meilleure preuve qu'il existe
  const byName = await osmQuery(short + " Paris");
  const poi = byName.find((h) => !/^(highway|place|boundary|landuse)$/.test(h.x.category || h.x.class) && shares(short, (h.x.name || "") + " " + (h.x.display_name || "").split(",")[0]));
  if (poi) return { kind: "lieu", la: poi.la, lo: poi.lo, name: poi.x.name || "", tags: poi.x.extratags || {}, disp: poi.x.display_name };
  // 2) sinon par l'adresse donnée (si elle commence par un numéro de rue) : l'adresse existe, mais le lieu n'est pas confirmé
  if (/^\d/.test(item.q)) {
    const byAdr = await osmQuery(item.q);
    const adr = byAdr.find((h) => /house|building|yes|residential|commercial|apartments/.test(h.x.type || "") || h.x.addresstype === "building");
    if (adr) return { kind: "adresse", la: adr.la, lo: adr.lo, name: adr.x.name || "", tags: adr.x.extratags || {}, disp: adr.x.display_name };
  } else if (item.q !== short + " Paris") {
    const byQ = await osmQuery(item.q);
    const p2 = byQ.find((h) => !/^(highway|place|boundary|landuse)$/.test(h.x.category || h.x.class) && shares(short, (h.x.name || "") + " " + (h.x.display_name || "").split(",")[0]));
    if (p2) return { kind: "lieu", la: p2.la, lo: p2.lo, name: p2.x.name || "", tags: p2.x.extratags || {}, disp: p2.x.display_name };
  }
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
async function fromSearch(item) {
  const key = tokens(item.t).slice(0, 3).join(" ");
  if (!key) return null;
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srnamespace=6&srlimit=8&srsearch=" + encodeURIComponent(item.t.replace(/ - .*/, "") + " Paris");
  const j = await getJson(u); await sleep(300);
  for (const f of ((j && j.query && j.query.search) || [])) {
    if (!/\.(jpe?g)$/i.test(f.title)) continue;
    if (!shares(item.t.replace(/ - .*/, ""), f.title)) continue;       // le nom du lieu doit figurer dans le nom du fichier
    const r = await imgInfo(f.title); if (r) { r.guess = true; return r; }
  }
  return null;
}
async function photo(item, o) {
  const t = (o && o.tags) || {};
  try {
    if (t.wikimedia_commons) { const c = t.wikimedia_commons; const r = /^Category:/i.test(c) ? await fromCategory(c) : await imgInfo(c); if (r) return r; }
    if (t.image && /commons\.wikimedia\.org\/wiki\/File:/.test(t.image)) { const r = await imgInfo(decodeURIComponent(t.image.split("/wiki/")[1])); if (r) return r; }
    if (t.wikidata) { const r = await fromWikidata(t.wikidata); if (r) return r; }
  } catch (e) {}
  try { return await fromSearch(item); } catch (e) { return null; }
}

(async () => {
  const seed = JSON.parse(fs.readFileSync("data/perles-paris-seed.json", "utf8"));
  say("Perles de Paris : " + seed.length + " adresses à vérifier");
  const ok = [], lost = [];
  let withPhoto = 0, poiCount = 0;
  for (const it of seed) {
    const o = await osm(it);
    if (!o) { lost.push(it); say("✗ introuvable : " + it.t + "  (" + it.q + ")"); continue; }
    const ph = await photo(it, o);
    if (o.kind === "lieu") poiCount++;
    if (ph) withPhoto++;
    ok.push({
      id: it.id, t: it.t, c: "Paris", la: +o.la.toFixed(6), lo: +o.lo.toFixed(6), k: it.k, e: it.e, d: it.d,
      p: ph ? ph.url : "", cr: ph ? "Photo : " + ph.art + " · " + ph.lic + " · Wikimedia Commons" : "", cu: ph ? ph.page : "",
      s: o.kind, v: it.v
    });
    say("✓ " + it.t + " [" + o.kind + (it.v ? "" : " · source ancienne") + "] " + (ph ? "photo " + (ph.guess ? "(à contrôler) " : "") + ph.page : "sans photo"));
  }
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
