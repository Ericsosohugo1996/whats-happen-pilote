// Héberge chez nous une version réduite (640 px, webp) des photos des 14 prochains jours
// pour les sites dont les images sont lourdes ou capricieuses (ex. cdn.paris.fr).
// Les gros services d'images (Wikimedia, OpenAgenda, Ticketmaster…) sont laissés tels quels.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT = "photos-local";
const DAYS = 14;               // fenêtre : aujourd'hui → +14 jours
const WIDTH = 640;
const MAX_NEW = 2500;          // plafond de nouvelles photos par exécution
const MAX_TOTAL = 6000;        // plafond du nombre de photos conservées
const MAX_BYTES = 15 * 1024 * 1024;
const CONC = 5;
// services qu'on ne copie pas (rapides et fiables)
const SKIP = /(^|\.)(wikimedia\.org|openagenda\.com|ticketm\.net|ticketmaster\.[a-z]+|pexels\.com|whazup\.fr|github\.io|githubusercontent\.com|googleusercontent\.com|firebasestorage\.googleapis\.com)$/i;

function hash(s) { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return ("00000000" + x.toString(16)).slice(-8); }

const today = new Date(); today.setUTCHours(0, 0, 0, 0);
const iso = d => d.toISOString().slice(0, 10);
const lo = iso(today), hi = iso(new Date(today.getTime() + DAYS * 864e5));

// 1) quelles photos faut-il ? (une photo = une URL, le plus proche en date d'abord)
const want = new Map(); // url -> date la plus proche
for (const f of fs.readdirSync("data/events")) {
  if (!f.endsWith(".json")) continue;
  let list; try { list = JSON.parse(fs.readFileSync(path.join("data/events", f), "utf8")); } catch (e) { continue; }
  if (!Array.isArray(list)) continue;
  for (const ev of list) {
    const u = ev && ev.photo; if (!u || !/^https?:\/\//i.test(u)) continue;
    const d = String(ev.date || "").slice(0, 10); if (d < lo || d > hi) continue;
    let host; try { host = new URL(u).hostname; } catch (e) { continue; }
    if (SKIP.test(host)) continue;
    if (!want.has(u) || d < want.get(u)) want.set(u, d);
  }
}
const wanted = [...want.entries()].sort((a, b) => a[1] < b[1] ? -1 : 1).slice(0, MAX_TOTAL).map(x => x[0]);
console.log("photos voulues :", wanted.length, "(", lo, "→", hi, ")");

fs.mkdirSync(OUT, { recursive: true });
const have = new Set(fs.readdirSync(OUT).filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5)));
const keep = new Set();
const todo = [];
for (const u of wanted) { const h = hash(u); keep.add(h); if (!have.has(h)) todo.push([u, h]); }

// 2) télécharger et réduire ce qui manque
async function grab([u, h]) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; WhazupBot/1.0; +https://whazup.fr)", "Accept": "image/*" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES || buf.length < 500) throw new Error("taille " + buf.length);
    const out = await sharp(buf, { failOn: "none" }).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
    fs.writeFileSync(path.join(OUT, h + ".webp"), out);
    keep.add(h); return "ok";
  } catch (e) { keep.delete(h); return "ko " + (e.message || e).toString().slice(0, 40); }
  finally { clearTimeout(t); }
}
(async () => {
  const batch = todo.slice(0, MAX_NEW);
  let ok = 0, ko = 0; const why = {};
  let i = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (i < batch.length) { const job = batch[i++]; const r = await grab(job); if (r === "ok") ok++; else { ko++; why[r] = (why[r] || 0) + 1; } }
  }));
  console.log("nouvelles photos : ok", ok, "échecs", ko, why, "restant à faire :", Math.max(0, todo.length - batch.length));
  // 3) supprimer ce qui n'est plus utile
  let del = 0;
  for (const h of have) if (!keep.has(h)) { fs.unlinkSync(path.join(OUT, h + ".webp")); del++; }
  console.log("supprimées :", del);
  // 4) liste des photos disponibles (lue par le site)
  const final = fs.readdirSync(OUT).filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5)).sort();
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ v: 1, n: final.length, h: final }));
  let bytes = 0; for (const h of final) bytes += fs.statSync(path.join(OUT, h + ".webp")).size;
  console.log("total :", final.length, "photos,", (bytes / 1048576).toFixed(1), "Mo");
})();
