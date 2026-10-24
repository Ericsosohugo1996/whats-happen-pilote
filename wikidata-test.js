// Whazup — ESSAI : récupère les lieux les plus célèbres de quelques villes sur Wikidata (données libres, domaine public).
// N'a AUCUN effet sur le site : écrit seulement des fichiers de test dans data/wikidata-test/.
// Pour tout retirer : supprimer ce fichier, son workflow, et le dossier data/wikidata-test/.
const fs = require("fs");
const path = require("path");

const CITIES = [
  { key: "lyon", name: "Lyon", lat: 45.764, lng: 4.8357, km: 5 },
  { key: "paris", name: "Paris", lat: 48.8566, lng: 2.3522, km: 6 },
  { key: "bordeaux", name: "Bordeaux", lat: 44.8378, lng: -0.5792, km: 5 },
  { key: "marseille", name: "Marseille", lat: 43.2965, lng: 5.3698, km: 6 },
  { key: "lille", name: "Lille", lat: 50.6292, lng: 3.0573, km: 4 },
  { key: "strasbourg", name: "Strasbourg", lat: 48.5734, lng: 7.7521, km: 4 }
];
const MIN_LANGS = 12;   // un lieu doit avoir une page Wikipédia dans au moins 12 langues
const MAX = 30;
const OUT = path.join("data", "wikidata-test");

function sparql(c) {
  return `SELECT ?item ?label ?desc ?sl ?img (GROUP_CONCAT(DISTINCT ?tl; separator=", ") AS ?types) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(${c.lng} ${c.lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${c.km}" . }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${MIN_LANGS})
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q5 }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item wdt:P31 ?t . ?t rdfs:label ?tl . FILTER(LANG(?tl) = "fr") }
  ?item rdfs:label ?label . FILTER(LANG(?label) = "fr")
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "fr") }
} GROUP BY ?item ?label ?desc ?sl ?img ORDER BY DESC(?sl) LIMIT 80`;
}

async function run(c) {
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql(c));
  const r = await fetch(url, { headers: { "User-Agent": "WhazupBot/1.0 (https://whazup.fr; contact@whazup.fr)", Accept: "application/sparql-results+json" }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  return j.results.bindings.map((b) => ({
    id: b.item.value.split("/").pop(), title: b.label.value, description: b.desc ? b.desc.value : "",
    langs: Number(b.sl.value), types: b.types ? b.types.value : "", image: b.img ? b.img.value : ""
  }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const lines = [];
  for (const c of CITIES) {
    try {
      const rows = await run(c);
      fs.writeFileSync(path.join(OUT, c.key + ".json"), JSON.stringify(rows.slice(0, MAX), null, 1));
      lines.push("== " + c.name + " (" + rows.length + " lieux) ==");
      rows.slice(0, MAX).forEach((x, i) => lines.push((i + 1) + ". " + x.title + " [" + x.langs + " langues] — " + (x.types || "?") + (x.description ? " — " + x.description : "")));
    } catch (e) {
      lines.push("== " + c.name + " : ÉCHEC (" + e.message + ") ==");
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  fs.writeFileSync(path.join(OUT, "_resume.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
})();
