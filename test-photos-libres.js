// Robot « Test des photos libres » : ne modifie RIEN dans l'appli. Il compte seulement
// combien de nos bars ont une photo libre chez OpenStreetMap, et sonde l'API DATAtourisme.
const fs = require("fs");
const DIR = "data/bars-plus";
const UA = "Whazup-bot/1.0 (https://whazup.fr)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const say = (s) => { console.log(s); out.push(s); };

async function overpass(q) {
  for (const url of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) {
    for (let t = 0; t < 3; t++) {
      try {
        const r = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
        if (r.ok) return await r.json();
      } catch (e) {}
      await sleep(5000);
    }
  }
  return null;
}

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const bars = [];
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(DIR + "/" + f, "utf8"));
      const list = Array.isArray(d) ? d : d.bars || d.items || [];
      for (const b of list) if (b && /^osm-(node|way|relation)-\d+$/.test(b.id || "")) bars.push({ city: f.replace(".json", ""), id: b.id, title: b.title, hasPhoto: !!b.photo });
    } catch (e) {}
  }
  say("Bars lus : " + bars.length + " dans " + files.length + " villes");
  say("Bars qui ont déjà une photo (Wikimedia/Wikidata) : " + bars.filter((b) => b.hasPhoto).length);

  // ---- 1) OpenStreetMap : étiquettes image / wikimedia_commons / mapillary ----
  const found = [];
  const byType = { node: [], way: [], relation: [] };
  for (const b of bars) { const m = b.id.split("-"); byType[m[1]].push(m[2]); }
  const idToBar = new Map(bars.map((b) => [b.id, b]));
  let lus = 0;
  for (const type of Object.keys(byType)) {
    const ids = byType[type];
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const j = await overpass("[out:json][timeout:120];" + type + "(id:" + chunk.join(",") + ");out tags;");
      if (!j) { say("Overpass n'a pas répondu pour un lot de " + type); continue; }
      for (const e of j.elements || []) {
        lus++;
        const t = e.tags || {};
        const img = t.image || t["image:0"] || "";
        const com = t.wikimedia_commons || "";
        if (img || com) found.push({ id: "osm-" + type + "-" + e.id, city: (idToBar.get("osm-" + type + "-" + e.id) || {}).city, title: t.name, image: img, commons: com });
      }
      await sleep(2000);
    }
  }
  say("OpenStreetMap : " + lus + " bars relus, dont " + found.length + " avec un lien photo (étiquette image ou wikimedia_commons)");
  const commons = found.filter((f) => f.commons).length;
  const imgs = found.filter((f) => f.image).length;
  say("  - avec wikimedia_commons : " + commons + " ; avec image : " + imgs);
  for (const f of found.slice(0, 8)) say("  exemple : " + f.city + " / " + f.title + " -> " + (f.commons || f.image).slice(0, 90));
  fs.writeFileSync(DIR + "/_test-osm-photos.json", JSON.stringify(found));

  // ---- 2) DATAtourisme : sonde de l'API (clé lue dans le secret, jamais affichée) ----
  const KEY = process.env.DATATOURISME_API_KEY || "";
  if (!KEY) say("DATAtourisme : pas de clé dans les secrets, sonde ignorée.");
  else {
    for (const p of ["/v1/catalog", "/v1/place", "/v1/foodEstablishment", "/v1/placeOfInterest"]) {
      try {
        const r = await fetch("https://api.datatourisme.fr" + p + "?page_size=1&lang=fr", { headers: { "X-API-Key": KEY, Accept: "application/json" } });
        const t = await r.text();
        say("DATAtourisme " + p + " -> HTTP " + r.status + " : " + t.replace(/\s+/g, " ").slice(0, 200));
      } catch (e) { say("DATAtourisme " + p + " -> erreur " + e.message); }
      await sleep(1500);
    }
  }
  fs.writeFileSync(DIR + "/_test-resume.txt", out.join("\n") + "\n");
})();
