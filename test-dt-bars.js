// Robot « Test DATAtourisme bars » : ne modifie RIEN dans l'appli. Sonde l'API (clé lue dans le secret,
// jamais affichée) pour savoir si elle contient des bars/cafés avec photo et comment les filtrer.
const fs = require("fs");
const BASE = "https://api.datatourisme.fr";
const KEY = process.env.DATATOURISME_API_KEY || "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const say = (s) => { console.log(s); out.push(s); };
async function get(p) {
  const r = await fetch(/^https?:/.test(p) ? p : BASE + p, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch (e) {}
  return { status: r.status, text: t, json: j };
}
const typesOf = (o) => [].concat(o.type || o["@type"] || o.types || []).map(String);
function hasImg(o) { return /https?:\\?\/\\?\/[^"]+\.(jpe?g|png|webp)/i.test(JSON.stringify(o.hasMainRepresentation || o.hasRepresentation || "")) || !!(o.hasMainRepresentation && JSON.stringify(o.hasMainRepresentation).includes("http")); }
(async () => {
  if (!KEY) { say("Pas de clé DATAtourisme dans les secrets."); fs.writeFileSync("data/bars-plus/_test-dt-resume.txt", out.join("\n") + "\n"); return; }
  // 1) forme de la réponse
  const a = await get("/v1/placeOfInterest?page_size=3&lang=fr");
  say("placeOfInterest -> HTTP " + a.status);
  if (a.json) {
    say("Clés de la réponse : " + Object.keys(a.json).join(", "));
    if (a.json.meta) say("meta : " + JSON.stringify(a.json.meta).slice(0, 300));
    const o = (a.json.objects || [])[0];
    if (o) { say("Clés d'un lieu : " + Object.keys(o).join(", ")); say("Types d'un lieu : " + JSON.stringify(typesOf(o)).slice(0, 300)); }
  }
  // 2) essais de filtres par type (on affiche le code HTTP et le début de la réponse)
  const tries = [
    "filters=" + encodeURIComponent("type[eq]=BarOrPub"),
    "filters=" + encodeURIComponent("rdf:type[eq]=BarOrPub"),
    "filters=" + encodeURIComponent("@type[eq]=BarOrPub"),
    "search=" + encodeURIComponent("bar"),
    "q=" + encodeURIComponent("bar"),
    "type=BarOrPub"
  ];
  for (const t of tries) {
    const r = await get("/v1/placeOfInterest?page_size=3&lang=fr&" + t);
    const first = r.json && (r.json.objects || [])[0];
    say("essai " + decodeURIComponent(t) + " -> HTTP " + r.status + " ; 1er lieu : " + (first ? JSON.stringify(typesOf(first)).slice(0, 120) : r.text.replace(/\s+/g, " ").slice(0, 120)));
    await sleep(1500);
  }
  // 3) échantillon : on parcourt des pages et on compte les bars/cafés et ceux qui ont une photo
  let url = "/v1/placeOfInterest?page_size=100&lang=fr", pages = 0, total = 0, bars = 0, barsPhoto = 0;
  const ex = [];
  while (url && pages < 60) {
    const r = await get(url);
    if (!r.json) { say("Échantillon arrêté (HTTP " + r.status + ")"); break; }
    for (const o of r.json.objects || []) {
      total++;
      const ty = typesOf(o).join(" ");
      if (/BarOrPub|CafeOrCoffeeShop|NightClub|WineBar|Brewery/i.test(ty)) { bars++; if (hasImg(o)) { barsPhoto++; if (ex.length < 5) ex.push(ty.slice(0, 80)); } }
    }
    const nx = r.json.meta && r.json.meta.next;
    url = nx ? nx : "";
    pages++;
    await sleep(1200);
  }
  say("Échantillon : " + total + " lieux lus, dont " + bars + " bars/cafés/boîtes, dont " + barsPhoto + " avec photo");
  for (const e of ex) say("  type : " + e);
  fs.writeFileSync("data/bars-plus/_test-dt-resume.txt", out.join("\n") + "\n");
})();
