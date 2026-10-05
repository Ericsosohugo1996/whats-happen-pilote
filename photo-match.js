// Règles pour décider si un article Wikipédia correspond bien à un lieu (utilisé par enrich-photos.js et split-data.js).
const STOP = new Set(("le la les un une des du de d l et en au aux sur sous dans pour par chez ses son sa leur " +
  "musee museum chateau eglise cathedrale basilique chapelle theatre palais domaine site jardin parc maison hotel " +
  "salle espace centre national nationale departemental municipal saint sainte st ste notre dame the of and").split(" "));

function norm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function tokens(s) {
  return norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w) && !/^[0-9]+$/.test(w));
}
// un article qui parle d'une rue, d'un quartier, d'une gare... n'est pas le lieu lui-même
const NOT_A_PLACE = /^(rue|avenue|boulevard|place|quartier|esplanade|gare|station|pont|quai|passage|square|allee|chemin|route|arrondissement|canton|commune|ligne|metro|impasse|villa|sentier|ruelle|cours|voie|statue|fontaine|cimetiere|stele|plaque)\b|funiculaire|\bmetro\b|\bligne \d/;
const RELIGIOUS = /eglise|cathedrale|basilique|chapelle|abbaye|collegiale|temple|synagogue|mosquee/;
const TYPE_WORD = /\b(musee|museum|chateau|eglise|cathedrale|basilique|chapelle|abbaye|collegiale|theatre|palais|domaine|hotel|jardin|parc|maison|fort|citadelle|monument|site)\b/;

function nameMatches(placeTitle, articleTitle) {
  const pn = norm(placeTitle), an = norm(articleTitle);
  if (NOT_A_PLACE.test(an)) return false;
  // article avec précision entre parenthèses sans type de lieu ("Grimaud (Var)") : c'est une commune
  if (/\([^)]*\)\s*$/.test(an) && !TYPE_WORD.test(an)) return false;
  // un théâtre doit correspondre à un article de théâtre / salle de spectacle
  if (/theatre/.test(pn) && !/theatre|comedie|opera|salle|bouffes|folies|olympia/.test(an)) return false;
  // une église ne correspond pas à un théâtre (et inversement)
  if (RELIGIOUS.test(an) !== RELIGIOUS.test(pn) && TYPE_WORD.test(an) && TYPE_WORD.test(pn)) return false;
  const p = tokens(placeTitle), a = tokens(articleTitle);
  if (!p.length || !a.length) return false;
  const pset = new Set(p), aset = new Set(a);
  let overlap = 0;
  for (const w of pset) if (aset.has(w)) overlap++;
  if (overlap < Math.max(1, Math.ceil(Math.min(pset.size, aset.size) * 0.6))) return false;
  // l'article est un simple sous-ensemble du nom du lieu et ne désigne aucun type de lieu (musée, théâtre...) :
  // c'est probablement un quartier ou un lieu-dit ("La Croix-Rousse"), pas le lieu lui-même
  const aSubset = [...aset].every((w) => pset.has(w));
  if (aSubset && aset.size < pset.size && !TYPE_WORD.test(an)) return false;
  return true;
}
module.exports = { nameMatches, tokens };
