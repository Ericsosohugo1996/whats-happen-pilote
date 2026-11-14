// Robot « Brocantes de Paris » : lit la page officielle de la Ville de Paris (paris.fr, « Brocantes et vide-greniers : on chine où ? »)
// et écrit paris-brocantes.json (même format que paris-events.json). Source affichée : Ville de Paris.
const fs = require("fs");
const PAGE = "https://www.paris.fr/pages/brocantes-et-vide-greniers-chiner-a-paris-18730";
const UA = "Whazup/1.0 (whazup.contact@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOIS = { janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 };
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const CENTRE = { 1: [48.8625, 2.3363], 2: [48.8683, 2.344], 3: [48.863, 2.36], 4: [48.854, 2.362], 5: [48.8445, 2.35], 6: [48.849, 2.333], 7: [48.856, 2.312], 8: [48.875, 2.31], 9: [48.877, 2.338], 10: [48.876, 2.36], 11: [48.859, 2.379], 12: [48.835, 2.396], 13: [48.828, 2.356], 14: [48.833, 2.327], 15: [48.841, 2.293], 16: [48.864, 2.262], 17: [48.887, 2.308], 18: [48.893, 2.348], 19: [48.887, 2.384], 20: [48.863, 2.401] };
const pad = (n) => String(n).padStart(2, "0");
function htmlToText(html) {
  const body = (html.match(/<main[\s\S]*<\/main>/i) || [html])[0];
  return body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|li|h1|h2|h3|h4|div|tr|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;|&#x27;/g, "'").replace(/[ \t]+/g, " ").split("\n").map((l) => l.trim()).filter(Boolean);
}
// « Samedi 14 novembre », « Du vendredi 13 au dimanche 15 novembre », « Samedi 14 et dimanche 15 novembre »
function parseDay(line, y, m) {
  if (!/^(du |lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i.test(line) || line.length > 80) return null;
  const nums = (line.match(/\b(\d{1,2})\b/g) || []).map(Number).filter((n) => n >= 1 && n <= 31);
  if (!nums.length) return null;
  const d1 = nums[0], d2 = nums.length > 1 ? nums[nums.length - 1] : null;
  const a = y + "-" + pad(m) + "-" + pad(d1);
  if (!d2 || d2 === d1) return { a, b: null };
  let y2 = y, m2 = m; if (d2 < d1) { m2 = m + 1; if (m2 > 12) { m2 = 1; y2 = y + 1; } }
  return { a, b: y2 + "-" + pad(m2) + "-" + pad(d2) };
}
function parseEvent(line) {
  if (!/brocante|vide[- ]?greniers?|trocante|braderie/i.test(line) || /sapins?|v[ée]hicule|stationnement/i.test(line)) return null;
  let t = line.replace(/\(\s*(\d+)\s*(e|er)\s*/gi, "($1$2").replace(/\s+\)/g, ")").replace(/\s+,/g, ",");
  const types = []; let mt;
  while ((mt = t.match(/^(brocante|vide[- ]?greniers?|trocante|braderie(?: de [a-zéèêû]+)?)(?:\s*,\s*|\s+et\s+|\s+)/i))) { types.push(fold(mt[1])); t = t.slice(mt[0].length); }
  if (!types.length) return null;
  const m = t.match(/^(.*?)\s*\((\d{1,2})\s*(?:e|er)[^)]*\)/i); if (!m) return null;
  const arr = parseInt(m[2], 10); if (!(arr >= 1 && arr <= 20)) return null;
  const kind = types.some((x) => /brocante|trocante/.test(x)) ? "Brocante" : types.some((x) => /braderie/.test(x)) ? "Braderie" : "Vide-greniers";
  const place = m[1].replace(/\s*\([^)]*\)/g, "").replace(/[,\s]+$/, "").replace(/^[,\s]+/, "").trim();
  if (!place) return null;
  return { kind, place, arr };
}
async function geocode(q, arr) {
  try {
    const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr&bounded=1&viewbox=2.22,48.92,2.47,48.80&q=" + encodeURIComponent(q);
    const r = await fetch(u, { headers: { "User-Agent": UA } }); const j = await r.json(); await sleep(1100);
    if (Array.isArray(j) && j[0]) { const la = +j[0].lat, lo = +j[0].lon; if (la > 48.8 && la < 48.92 && lo > 2.22 && lo < 2.47) return [la, lo, 1]; }
  } catch (e) {}
  return null;
}
(async () => {
  const r = await fetch(PAGE, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!r.ok) { console.log("Page illisible : HTTP", r.status); return; }
  const lines = htmlToText(await r.text());
  const today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  let y = 0, m = 0, day = null; const raw = [];
  for (const l of lines) {
    const mh = l.match(/^(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(20\d\d)$/i);
    if (mh) { m = MOIS[fold(mh[1])]; y = +mh[2]; day = null; continue; }
    if (/^les march[ée]s/i.test(l) && raw.length) break;
    if (!y) continue;
    const d = parseDay(l, y, m); if (d) { day = d; continue; }
    if (!day) continue;
    const e = parseEvent(l); if (e) raw.push(Object.assign({}, e, day));
  }
  const keep = raw.filter((e) => (e.b || e.a) >= today);
  console.log("Lignes lues :", lines.length, "— événements trouvés :", raw.length, "— à venir :", keep.length);
  if (keep.length < 10) { console.log("Trop peu d'événements : fichier non écrasé (la page a peut-être changé)."); return; }
  const cache = {}, now = Date.now(), out = [], seen = {};
  let precise = 0;
  const km = (p, q) => { const r = Math.PI / 180, x = (q[1] - p[1]) * r * Math.cos(p[0] * r), y = (q[0] - p[0]) * r; return 6371 * Math.sqrt(x * x + y * y); };
  for (const e of keep) {
    // une brocante peut s'étendre sur plusieurs rues : on place chaque rue ; si elles sont proches on prend le milieu, sinon la place citée (ou la première rue)
    let segs = e.place.replace(/«[^»]*»,?\s*/g, "").split(/,\s*| et (?=(?:rue|avenue|boulevard|place|quai|cours|passage|impasse|square|allée)\b)/i).map((x) => x.trim()).filter(Boolean);
    segs = segs.map((x) => x.replace(/^(sur le |sur la |sur l')?(terre[- ]plein( central)?( du| de la| de l')?\s*)/i, "").trim()).filter(Boolean);
    if (segs.length && /^(place|rue|avenue|boulevard|cours|quai)$/i.test(segs[0]) && segs[1]) segs = [(segs[0] + " et " + segs[1]).trim()].concat(segs.slice(2));
    const pts = [];
    for (const sg of segs.slice(0, 3)) {
      const q = sg + ", 750" + pad(e.arr) + " Paris";
      if (!(q in cache)) cache[q] = await geocode(q, e.arr);
      if (cache[q]) pts.push({ sg, c: cache[q] });
    }
    let g = null;
    if (pts.length === 1) g = pts[0].c;
    else if (pts.length > 1) {
      const near = pts.filter((p) => km(p.c, pts[0].c) < 1.2);
      if (near.length === pts.length) g = [pts.reduce((a, p) => a + p.c[0], 0) / pts.length, pts.reduce((a, p) => a + p.c[1], 0) / pts.length, 1];
      else { const pl = pts.find((p) => /^place\b/i.test(p.sg)); g = (pl || pts[0]).c; }
    }
    if (g) precise++;
    const c = g || CENTRE[e.arr];
    const id = "pbroc-" + e.a + "-" + slug(e.place) + "-" + e.arr; if (seen[id]) continue; seen[id] = 1;
    const label = e.kind + (e.place.length > 60 ? "" : ", " + e.place.charAt(0).toLowerCase() + e.place.slice(1));
    const ev = { id, scene: "marche", city: "paris", category: "Brocante", title: label.charAt(0).toUpperCase() + label.slice(1), date: e.a, time: "", place: e.place + ", 750" + pad(e.arr) + " Paris", lat: +c[0].toFixed(6), lng: +c[1].toFixed(6), price: "Gratuit", thumb: "", source: "ville-de-paris-brocantes", createdAt: now,
      description: e.kind + " dans le " + e.arr + (e.arr === 1 ? "er" : "e") + " arrondissement. Source : Ville de Paris (calendrier officiel). Pensez à vérifier la date avant de vous déplacer : un événement peut être annulé, notamment en cas de mauvais temps.", link: PAGE };
    if (e.b) ev.dateEnd = e.b;
    out.push(ev);
  }
  fs.writeFileSync("paris-brocantes.json", JSON.stringify(out));
  fs.mkdirSync("data/brocantes-test", { recursive: true });
  fs.writeFileSync("data/brocantes-test/_rapport-paris.txt", "Brocantes de Paris : " + out.length + " événements à venir (adresses placées précisément : " + precise + " / " + keep.length + ")\n" + out.map((x) => x.date + (x.dateEnd ? "→" + x.dateEnd : "") + " | " + x.title + " | " + x.place + " | " + x.lat + "," + x.lng).join("\n") + "\n");
  console.log("Écrit :", out.length, "événements");
})();
