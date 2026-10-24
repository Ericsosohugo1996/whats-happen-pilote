// Whazup — « À ne pas manquer » : récupère, pour chaque ville de l'appli, les lieux les plus célèbres sur Wikidata
// (base libre, domaine public). Écrit data/wikidata/<ville>.json. Lancé une fois par mois par son workflow.
// N'écrase jamais un fichier existant par un résultat vide. Pour tout retirer : supprimer ce fichier, son workflow et data/wikidata/.
const fs = require("fs");
const path = require("path");

const OUT = path.join("data", "wikidata");
const MAX = 40;
const BIG = new Set(["paris", "lyon", "marseille", "toulouse", "nice", "bordeaux", "nantes", "lille", "strasbourg"]);

function readCities() {
  const src = fs.readFileSync("app.js", "utf8");
  const start = src.indexOf("const CITIES = {"), end = src.indexOf("\n};", start);
  const re = /^\s*(\w+):\s*\{\s*name:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/gm;
  const out = []; let m;
  while ((m = re.exec(src.slice(start, end)))) out.push({ key: m[1], name: m[2], lat: +m[3], lng: +m[4] });
  return out;
}

function sparql(c, minLangs, km) {
  return `SELECT ?item ?label ?desc ?sl ?img ?loc (GROUP_CONCAT(DISTINCT ?tl; separator=", ") AS ?types) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(${c.lng} ${c.lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${km}" . }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${minLangs})
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q5 }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item wdt:P31 ?t . ?t rdfs:label ?tl . FILTER(LANG(?tl) = "fr") }
  ?item rdfs:label ?label . FILTER(LANG(?label) = "fr")
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "fr") }
} GROUP BY ?item ?label ?desc ?sl ?img ?loc ORDER BY DESC(?sl) LIMIT 500`;
}

// on garde ce qu'un visiteur va voir ; on écarte communes, écoles, gares, batailles, cantons, tournois, compagnies…
const KEEP = /mus[ée]e|cath[ée]drale|basilique|[ée]glise|chapelle|abbaye|ch[âa]teau|forteresse|\bfort\b|palais|\btour\b|monument|\bpont\b|\bplace\b|\bparc\b|jardin|quartier|plage|\bîle\b|th[ée][âa]tre|op[ée]ra|cimeti[èe]re|arc de triomphe|site touristique|point d'int[ée]r[êe]t|lieu d'int[ée]r[êe]t|ruines|amphith[ée][âa]tre|avenue|\bport\b|synagogue|mosqu[ée]e|temple|secteur sauvegard[ée]|patrimoine mondial|site arch[ée]ologique|colline|belv[ée]d[èe]re|fontaine|hôtel de ville|panorama|funiculaire|halle|grotte|cascade|\blac\b|for[êe]t|\brue\b|passage|traboule|statue|escalier|citadelle|remparts|\bporte\b/i;
const DROP = /commune|canton|arrondissement|universit[ée]|[ée]cole|gare|m[ée]tro|tramway|si[èe]ge|bataille|tournoi|championnat|r[ée]gion|d[ée]partement|entreprise|organisation|attentat|massacre|m[ée]tropole|province|[ée]tat historique|r[ée]gime|conf[ée]rence|accord|trait[ée]|court[- ]m[ée]trage|film|langue|jeux olympiques|saison|stade|observatoire|biblioth[èe]que nationale|institution|[ée]tablissement d'enseignement|intercommunalit[ée]|communaut[ée]|chaîne|r[ée]seau|compagnie|groupe des arts|cour d'|tribunal|palais de justice|prud|port maritime|installation sportive|base nautique|quartier administratif|quartier d'affaires|aire urbaine d|d[ée]truit|disparu|rasé/i;
const SAVE = /mus[ée]e|cath[ée]drale|basilique|ch[âa]teau|monument|palais|th[ée][âa]tre|op[ée]ra|site touristique/i;
function pertinent(x) {
  const ty = x.types || "";
  if (DROP.test(ty) && !SAVE.test(ty)) return false;
  if (/d[ée]truit|disparu|rasé|ancien château|ancienne? (compagnie|institution)/i.test(ty + " " + (x.description || ""))) return false;
  if (/compagnie|institution th[ée]âtrale|palais de justice|cour d'assises/i.test(ty + " " + (x.description || ""))) return false;
  return KEEP.test(ty + " | " + (x.description || ""));
}
const RELIG = /[ée]glise|basilique|cath[ée]drale|chapelle|abbaye|abbatiale|synagogue|mosqu[ée]e|temple|collégiale|sanctuaire/i;
const MUSEE = /mus[ée]e/i;
const QUART = /quartier|\bîle\b|colline|centre historique/i;
function group(x) { const t = (x.types || "") + " " + x.title; if (RELIG.test(t)) return "r"; if (MUSEE.test(t)) return "m"; if (QUART.test(x.types || "")) return "q"; return "a"; }
// ordre final : par notoriété, mais sans que les églises ou les musées prennent toute la tête de liste
function diversify(rows) {
  const cap = { r: 3, m: 3, q: 3, a: 99 }, n = { r: 0, m: 0, q: 0, a: 0 }, head = [], rest = [];
  for (const x of rows) { const g = group(x); if (head.length < 12 && n[g] < cap[g]) { n[g]++; head.push(x); } else rest.push(x); }
  return head.concat(rest);
}
function clean(rows) {
  const seen = new Set();
  return diversify(rows.filter((x) => pertinent(x) && !seen.has(x.title.toLowerCase()) && seen.add(x.title.toLowerCase())));
}

async function query(c, minLangs, km) {
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql(c, minLangs, km));
  let err;
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "WhazupBot/1.0 (https://whazup.fr; contact@whazup.fr)", Accept: "application/sparql-results+json" }, signal: AbortSignal.timeout(70000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      return j.results.bindings.map((b) => {
        const m = b.loc && /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.loc.value);
        return {
          id: b.item.value.split("/").pop(), title: b.label.value, description: b.desc ? b.desc.value : "",
          langs: Number(b.sl.value), types: b.types ? b.types.value : "", image: b.img ? b.img.value.replace(/^http:/, "https:") : "",
          lat: m ? +m[2] : null, lng: m ? +m[1] : null
        };
      });
    } catch (e) { err = e; await new Promise((r) => setTimeout(r, 4000 * a)); }
  }
  throw err;
}

if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
  let ok = 0, ko = 0;
  for (const c of readCities()) {
    if (only && !only.has(c.key)) continue;
    try {
      const big = BIG.has(c.key);
      const rows = clean(await query(c, big ? 8 : 5, big ? 4 : 3)).slice(0, MAX);
      if (rows.length >= 3) { fs.writeFileSync(path.join(OUT, c.key + ".json"), JSON.stringify(rows)); ok++; console.log(c.name + " : " + rows.length + " lieux"); }
      else { console.log(c.name + " : trop peu de lieux (" + rows.length + "), on garde l'ancien fichier"); }
    } catch (e) { ko++; console.log(c.name + " : échec (" + e.message + "), on garde l'ancien fichier"); }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("terminé : " + ok + " villes mises à jour, " + ko + " échecs");
})();
module.exports = { clean, pertinent, diversify };
