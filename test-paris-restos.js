// Robot « Test restaurants de Paris » : ne modifie RIEN dans l'appli. Cherche des restaurants, cafés et bars de Paris
// qui ont une photo libre (Wikidata / Wikimedia Commons, OpenStreetMap) et écrit un compte rendu dans data/restos-test/.
const fs = require("fs");
const UA = { "User-Agent": "Whazup-test/1.0 (whazup.contact@gmail.com)", Accept: "application/json" };
const out = [];
const say = (s) => { console.log(s); out.push(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function postJson(url, body, headers) {
  const r = await fetch(url, { method: "POST", headers: Object.assign({ "Content-Type": "application/x-www-form-urlencoded" }, UA, headers || {}), body });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  return { status: r.status, json: j, text: t };
}
const commonsUrl = (v) => {
  v = String(v || "").trim(); if (!v) return "";
  if (/^https?:/.test(v)) return v.replace(/^http:/, "https:");
  v = v.replace(/^(File|Fichier):/i, "");
  return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(v.replace(/ /g, "_")) + "?width=800";
};
(async () => {
  fs.mkdirSync("data/restos-test", { recursive: true });
  const sample = [];
  // 1) Wikidata : restaurants, cafés, bars de Paris, avec ou sans image
  const sparql = `SELECT ?item ?label ?desc ?sl ?img ?loc (GROUP_CONCAT(DISTINCT ?tl; separator=", ") AS ?types) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(2.3522 48.8566)"^^geo:wktLiteral . bd:serviceParam wikibase:radius "11" . }
  VALUES ?cls { wd:Q11707 wd:Q30022 wd:Q187456 }
  ?item wdt:P31 ?t . ?t wdt:P279* ?cls .
  ?item wikibase:sitelinks ?sl .
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?t rdfs:label ?tl . FILTER(LANG(?tl) = "fr") }
  ?item rdfs:label ?label . FILTER(LANG(?label) = "fr")
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "fr") }
} GROUP BY ?item ?label ?desc ?sl ?img ?loc ORDER BY DESC(?sl) LIMIT 800`;
  let wd = await postJson("https://query.wikidata.org/sparql", "format=json&query=" + encodeURIComponent(sparql));
  if (!wd.json) { say("Wikidata : HTTP " + wd.status + " " + String(wd.text).slice(0, 120).replace(/\s+/g, " ")); }
  else {
    const rows = wd.json.results.bindings.map((b) => ({ title: b.label.value, desc: b.desc ? b.desc.value : "", types: b.types ? b.types.value : "", sl: +b.sl.value, img: b.img ? commonsUrl(b.img.value) : "", loc: b.loc.value, uri: b.item.value }));
    const seen = new Set(), uniq = rows.filter((r) => !seen.has(r.uri) && seen.add(r.uri));
    const withImg = uniq.filter((r) => r.img);
    say("Wikidata Paris : " + uniq.length + " restaurants/cafés/bars, dont " + withImg.length + " avec photo libre");
    withImg.slice(0, 40).forEach((r) => say("  • " + r.title + " (" + r.sl + " langues) — " + r.types.slice(0, 50) + " — " + r.desc.slice(0, 70)));
    withImg.forEach((r) => sample.push({ source: "wikidata", title: r.title, desc: r.desc, types: r.types, photo: r.img, loc: r.loc, uri: r.uri }));
  }
  await sleep(2000);
  // 2) OpenStreetMap : adresses de Paris qui portent une photo, un lien Commons ou un lien Wikidata
  const q = `[out:json][timeout:120];
(nwr["amenity"~"^(restaurant|bar|cafe|pub)$"]["name"](48.815,2.25,48.905,2.42)["wikimedia_commons"];
 nwr["amenity"~"^(restaurant|bar|cafe|pub)$"]["name"](48.815,2.25,48.905,2.42)["image"];
 nwr["amenity"~"^(restaurant|bar|cafe|pub)$"]["name"](48.815,2.25,48.905,2.42)["wikidata"];);
out center tags 600;`;
  let op = await postJson("https://overpass-api.de/api/interpreter", "data=" + encodeURIComponent(q));
  if (!op.json) { say("OpenStreetMap : HTTP " + op.status + " " + String(op.text).slice(0, 120).replace(/\s+/g, " ")); }
  else {
    const els = op.json.elements || [], photos = els.filter((e) => e.tags && (e.tags.image || e.tags.wikimedia_commons));
    say("OpenStreetMap Paris : " + els.length + " adresses avec lien photo ou Wikidata, dont " + photos.length + " avec image ou Commons");
    photos.slice(0, 40).forEach((e) => say("  • " + e.tags.name + " — " + (e.tags.cuisine || e.tags.amenity) + " — " + String(e.tags.image || e.tags.wikimedia_commons).slice(0, 70)));
    photos.forEach((e) => sample.push({ source: "osm", title: e.tags.name, desc: e.tags.description || "", types: (e.tags.cuisine || "") + " " + e.tags.amenity, photo: commonsUrl(e.tags.image || e.tags.wikimedia_commons), loc: (e.lat || (e.center && e.center.lat)) + "," + (e.lon || (e.center && e.center.lon)), uri: "osm:" + e.type + "/" + e.id }));
  }
  await sleep(2000);
  // 3) Brunchs de Paris (OpenStreetMap : cuisine=brunch, ou « brunch » dans le nom ou la description)
  const qb = `[out:json][timeout:120];
(nwr["amenity"~"^(restaurant|cafe|bar|pub)$"]["cuisine"~"brunch",i](48.815,2.25,48.905,2.42);
 nwr["amenity"~"^(restaurant|cafe|bar|pub)$"]["name"~"brunch",i](48.815,2.25,48.905,2.42);
 nwr["amenity"~"^(restaurant|cafe|bar|pub)$"]["description"~"brunch",i](48.815,2.25,48.905,2.42););
out center tags 800;`;
  const ob = await postJson("https://overpass-api.de/api/interpreter", "data=" + encodeURIComponent(qb));
  if (!ob.json) { say("Brunchs : HTTP " + ob.status + " " + String(ob.text).slice(0, 120).replace(/\s+/g, " ")); }
  else {
    const els = (ob.json.elements || []).filter((e) => e.tags && e.tags.name);
    const withPhoto = els.filter((e) => e.tags.image || e.tags.wikimedia_commons);
    const withHours = els.filter((e) => e.tags.opening_hours);
    say("Brunchs Paris (OpenStreetMap) : " + els.length + " adresses, dont " + withPhoto.length + " avec photo, " + withHours.length + " avec horaires");
    els.slice(0, 40).forEach((e) => say("  • " + e.tags.name + " — " + (e.tags["addr:street"] || "") + " — " + (e.tags.description || e.tags.cuisine || "").slice(0, 70)));
    fs.writeFileSync("data/restos-test/_paris-brunchs.json", JSON.stringify(els.slice(0, 300).map((e) => ({ title: e.tags.name, street: e.tags["addr:street"] || "", cuisine: e.tags.cuisine || "", hours: e.tags.opening_hours || "", website: e.tags.website || "", photo: e.tags.image || e.tags.wikimedia_commons || "", lat: e.lat || (e.center && e.center.lat), lng: e.lon || (e.center && e.center.lon) })), null, 1));
  }
  fs.writeFileSync("data/restos-test/_paris-resume.txt", out.join("\n") + "\n");
  fs.writeFileSync("data/restos-test/_paris-exemples.json", JSON.stringify(sample.slice(0, 300), null, 1));
})();
