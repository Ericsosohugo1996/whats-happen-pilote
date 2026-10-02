// ============================================================================
// Worker Cloudflare — import quotidien des BARS (OpenStreetMap) dans Whazup
// ============================================================================
// Troisième Worker de la même famille que datatourisme-sync-worker.js (événements) et
// datatourisme-places-sync-worker.js (musées/monuments) : DataTourisme, base institutionnelle
// alimentée par les offices de tourisme, ne couvre quasiment pas les bars — pour cette
// catégorie, on utilise à la place OpenStreetMap (licence ODbL, gratuit, sans clé API),
// via son API de requêtes Overpass, qui a une bien meilleure couverture des bars en France.
//
// Principe : une seule requête Overpass QL interroge, pour chacune des villes déjà connues
// de Whazup, tous les nœuds OSM avec amenity=bar ou amenity=pub dans un rayon de RADIUS_KM
// (le "around" d'Overpass fait exactement ce filtrage côté serveur — contrairement aux deux
// autres Workers, pas besoin de télécharger puis filtrer un fichier national volumineux).
// Le résultat est commité dans "osm-bars.json" sur GitHub, chargé par app.js comme un
// fichier de plus (catégorie "Bar", déjà prévue dans l'UI mais jusqu'ici sans aucun contenu).
//
// Configuration Cloudflare : même principe que les deux autres Workers — GITHUB_TOKEN en
// secret, GITHUB_OWNER/GITHUB_REPO en variables (valeurs par défaut ci-dessous sinon).
// Ce Worker est beaucoup plus léger que les deux autres (pas de CSV de plusieurs dizaines/
// centaines de Mo à streamer) : le plan gratuit (10ms CPU) peut suffire, mais comme les
// trois Workers partagent déjà le plan Workers Paid de Whazup, pas besoin d'y toucher.
//
// Cron Triggers : ajouter "0 3 * * *" (encore 15 min après celui des lieux DataTourisme,
// pour étaler les trois traitements).
//
// Test manuel : une requête GET sur l'URL du Worker déclenche un passage immédiat et
// renvoie un résumé JSON (nombre de bars retenus, répartition par ville).
//
// Bonnes pratiques Overpass (service public, gratuit, à usage raisonnable) : un seul gros
// appel par jour (le cron), un User-Agent identifiable, et un timeout confortable côté
// requête ([timeout:180]) — largement dans les clous d'un usage respectueux du service.
// ============================================================================
 
// L'adresse générique overpass-api.de est parfois indisponible (erreur 521), et le miroir
// français openstreetmap.fr bloque les accès automatisés non white-listés (erreur 403) — ce
// sous-domaine spécifique de l'instance principale s'est montré rapide et fiable aux tests.
const OVERPASS_URL = "https://lz4.overpass-api.de/api/interpreter";
const RADIUS_KM = 20; // même rayon que "autour de moi" dans l'app (state.radiusKm)
const OUTPUT_PATH = "osm-bars.json";
const MAX_DESCRIPTION_LEN = 300;
const BAR_CATEGORY = "Bar";
 
// ---- mêmes villes que CITIES dans app.js (copie : ce Worker tourne hors navigateur) ----
const CITIES_COORDS = {
  aix: { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  st: { name: "Saint-Tropez", lat: 43.2677, lng: 6.6407 },
  ram: { name: "Ramatuelle", lat: 43.2135, lng: 6.6155 },
  ste: { name: "Sainte-Maxime", lat: 43.3097, lng: 6.639 },
  lcv: { name: "La Croix-Valmer", lat: 43.2076, lng: 6.5729 },
  sens: { name: "Sens", lat: 48.1975, lng: 3.2823 },
  drag: { name: "Draguignan", lat: 43.5375, lng: 6.4627 },
  moug: { name: "Mougins", lat: 43.6008, lng: 6.9956 },
  mart: { name: "Martigues", lat: 43.4056, lng: 5.0487 },
  paris: { name: "Paris", lat: 48.8566, lng: 2.3522 },
  nantes: { name: "Nantes", lat: 47.2184, lng: -1.5536 },
  rennes: { name: "Rennes", lat: 48.1173, lng: -1.6778 },
  brest: { name: "Brest", lat: 48.3904, lng: -4.4861 },
  bordeaux: { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  toulouse: { name: "Toulouse", lat: 43.6047, lng: 1.4442 },
  marseille: { name: "Marseille", lat: 43.2965, lng: 5.3698 },
  montgeron: { name: "Montgeron", lat: 48.7039, lng: 2.4605 },
  lille: { name: "Lille", lat: 50.6292, lng: 3.0573 },
  dijon: { name: "Dijon", lat: 47.322, lng: 5.0415 },
  chambery: { name: "Chambéry", lat: 45.5646, lng: 5.9178 },
  rouen: { name: "Rouen", lat: 49.4432, lng: 1.0999 },
  reims: { name: "Reims", lat: 49.2583, lng: 4.0317 },
  montpellier: { name: "Montpellier", lat: 43.6108, lng: 3.8767 },
  angers: { name: "Angers", lat: 47.4784, lng: -0.5632 },
  avignon: { name: "Avignon", lat: 43.9493, lng: 4.8055 },
  strasbourg: { name: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  metz: { name: "Metz", lat: 49.1193, lng: 6.1757 },
  caen: { name: "Caen", lat: 49.1829, lng: -0.3707 },
  bourgenbresse: { name: "Bourg-en-Bresse", lat: 46.2059, lng: 5.2265 },
  laon: { name: "Laon", lat: 49.5642, lng: 3.6222 },
  moulins: { name: "Moulins", lat: 46.5654, lng: 3.3328 },
  digne: { name: "Digne-les-Bains", lat: 44.0916, lng: 6.2354 },
  gap: { name: "Gap", lat: 44.5594, lng: 6.0679 },
  nice: { name: "Nice", lat: 43.7102, lng: 7.262 },
  privas: { name: "Privas", lat: 44.7355, lng: 4.5987 },
  charleville: { name: "Charleville-Mézières", lat: 49.7739, lng: 4.7196 },
  foix: { name: "Foix", lat: 42.9647, lng: 1.6053 },
  troyes: { name: "Troyes", lat: 48.2973, lng: 4.0744 },
  carcassonne: { name: "Carcassonne", lat: 43.213, lng: 2.3491 },
  rodez: { name: "Rodez", lat: 44.3506, lng: 2.573 },
  aurillac: { name: "Aurillac", lat: 44.9276, lng: 2.4434 },
  angouleme: { name: "Angoulême", lat: 45.6484, lng: 0.156 },
  larochelle: { name: "La Rochelle", lat: 46.1603, lng: -1.1511 },
  bourges: { name: "Bourges", lat: 47.0833, lng: 2.3986 },
  tulle: { name: "Tulle", lat: 45.2667, lng: 1.7714 },
  ajaccio: { name: "Ajaccio", lat: 41.9272, lng: 8.7369 },
  bastia: { name: "Bastia", lat: 42.7028, lng: 9.45 },
  stbrieuc: { name: "Saint-Brieuc", lat: 48.5142, lng: -2.7652 },
  gueret: { name: "Guéret", lat: 46.1667, lng: 1.8667 },
  perigueux: { name: "Périgueux", lat: 45.1848, lng: 0.7218 },
  besancon: { name: "Besançon", lat: 47.238, lng: 6.0243 },
  valence: { name: "Valence", lat: 44.9334, lng: 4.8924 },
  evreux: { name: "Évreux", lat: 49.027, lng: 1.1511 },
  chartres: { name: "Chartres", lat: 48.4439, lng: 1.4894 },
  quimper: { name: "Quimper", lat: 47.996, lng: -4.0972 },
  nimes: { name: "Nîmes", lat: 43.8367, lng: 4.3601 },
  auch: { name: "Auch", lat: 43.6459, lng: 0.586 },
  chateauroux: { name: "Châteauroux", lat: 46.8106, lng: 1.6947 },
  tours: { name: "Tours", lat: 47.3941, lng: 0.6848 },
  grenoble: { name: "Grenoble", lat: 45.1885, lng: 5.7245 },
  lons: { name: "Lons-le-Saunier", lat: 46.6739, lng: 5.55 },
  montdemarsan: { name: "Mont-de-Marsan", lat: 43.8905, lng: -0.4995 },
  blois: { name: "Blois", lat: 47.5861, lng: 1.3359 },
  stetienne: { name: "Saint-Étienne", lat: 45.4397, lng: 4.3872 },
  lepuy: { name: "Le Puy-en-Velay", lat: 45.043, lng: 3.885 },
  orleans: { name: "Orléans", lat: 47.9029, lng: 1.9093 },
  cahors: { name: "Cahors", lat: 44.4478, lng: 1.437 },
  agen: { name: "Agen", lat: 44.2049, lng: 0.6212 },
  mende: { name: "Mende", lat: 44.5183, lng: 3.5003 },
  stlo: { name: "Saint-Lô", lat: 49.1147, lng: -1.09 },
  chalons: { name: "Châlons-en-Champagne", lat: 48.9566, lng: 4.3634 },
  chaumont: { name: "Chaumont", lat: 48.1113, lng: 5.1394 },
  laval: { name: "Laval", lat: 48.0698, lng: -0.77 },
  nancy: { name: "Nancy", lat: 48.6921, lng: 6.1844 },
  barleduc: { name: "Bar-le-Duc", lat: 48.7706, lng: 5.1613 },
  vannes: { name: "Vannes", lat: 47.6582, lng: -2.7602 },
  nevers: { name: "Nevers", lat: 46.9896, lng: 3.159 },
  beauvais: { name: "Beauvais", lat: 49.4295, lng: 2.0807 },
  alencon: { name: "Alençon", lat: 48.4322, lng: 0.0925 },
  arras: { name: "Arras", lat: 50.2916, lng: 2.7773 },
  clermont: { name: "Clermont-Ferrand", lat: 45.7772, lng: 3.087 },
  pau: { name: "Pau", lat: 43.2951, lng: -0.3708 },
  tarbes: { name: "Tarbes", lat: 43.2328, lng: 0.0781 },
  perpignan: { name: "Perpignan", lat: 42.6886, lng: 2.8948 },
  colmar: { name: "Colmar", lat: 48.0794, lng: 7.3585 },
  lyon: { name: "Lyon", lat: 45.764, lng: 4.8357 },
  vesoul: { name: "Vesoul", lat: 47.6167, lng: 6.15 },
  macon: { name: "Mâcon", lat: 46.3067, lng: 4.8283 },
  lemans: { name: "Le Mans", lat: 48.0061, lng: 0.1996 },
  annecy: { name: "Annecy", lat: 45.8992, lng: 6.1294 },
  melun: { name: "Melun", lat: 48.5399, lng: 2.6597 },
  versailles: { name: "Versailles", lat: 48.8049, lng: 2.1204 },
  niort: { name: "Niort", lat: 46.3239, lng: -0.4587 },
  amiens: { name: "Amiens", lat: 49.8942, lng: 2.2957 },
  albi: { name: "Albi", lat: 43.9298, lng: 2.148 },
  montauban: { name: "Montauban", lat: 44.0181, lng: 1.355 },
  toulon: { name: "Toulon", lat: 43.1242, lng: 5.928 },
  laroche: { name: "La Roche-sur-Yon", lat: 46.6705, lng: -1.4266 },
  poitiers: { name: "Poitiers", lat: 46.5802, lng: 0.3404 },
  limoges: { name: "Limoges", lat: 45.8336, lng: 1.2611 },
  epinal: { name: "Épinal", lat: 48.1742, lng: 6.446 },
  auxerre: { name: "Auxerre", lat: 47.7982, lng: 3.573 },
  belfort: { name: "Belfort", lat: 47.6386, lng: 6.8631 },
  evry: { name: "Évry-Courcouronnes", lat: 48.63, lng: 2.44 },
  nanterre: { name: "Nanterre", lat: 48.8924, lng: 2.2065 },
  bobigny: { name: "Bobigny", lat: 48.9075, lng: 2.4392 },
  creteil: { name: "Créteil", lat: 48.7904, lng: 2.4556 },
  cergy: { name: "Cergy", lat: 49.0367, lng: 2.0761 },
  basseterre: { name: "Basse-Terre", lat: 15.9958, lng: -61.7296 },
  fortdefrance: { name: "Fort-de-France", lat: 14.6161, lng: -61.0588 },
  cayenne: { name: "Cayenne", lat: 4.9333, lng: -52.3333 },
  stdenisreunion: { name: "Saint-Denis (La Réunion)", lat: -20.8823, lng: 55.4504 },
  mamoudzou: { name: "Mamoudzou", lat: -12.7806, lng: 45.2278 },
  saintmalo: { name: "Saint-Malo", lat: 48.6493, lng: -2.0257 },
  lorient: { name: "Lorient", lat: 47.7482, lng: -3.366 },
  stnazaire: { name: "Saint-Nazaire", lat: 47.2734, lng: -2.2137 },
  cherbourg: { name: "Cherbourg-en-Cotentin", lat: 49.6337, lng: -1.6222 },
  dieppe: { name: "Dieppe", lat: 49.9219, lng: 1.079 },
  deauville: { name: "Deauville", lat: 49.3592, lng: 0.0754 },
  dunkerque: { name: "Dunkerque", lat: 51.0343, lng: 2.3768 },
  calais: { name: "Calais", lat: 50.9513, lng: 1.8587 },
  boulognesurmer: { name: "Boulogne-sur-Mer", lat: 50.7264, lng: 1.6147 },
  compiegne: { name: "Compiègne", lat: 49.418, lng: 2.826 },
  mulhouse: { name: "Mulhouse", lat: 47.7508, lng: 7.3359 },
  verdun: { name: "Verdun", lat: 49.1593, lng: 5.3844 },
  epernay: { name: "Épernay", lat: 49.0417, lng: 3.96 },
  chalonsursaone: { name: "Chalon-sur-Saône", lat: 46.7806, lng: 4.8528 },
  beaune: { name: "Beaune", lat: 47.0245, lng: 4.8397 },
  roanne: { name: "Roanne", lat: 46.0333, lng: 4.0667 },
  vichy: { name: "Vichy", lat: 46.1279, lng: 3.4265 },
  annemasse: { name: "Annemasse", lat: 46.1936, lng: 6.2358 },
  cannes: { name: "Cannes", lat: 43.5528, lng: 7.0174 },
  antibes: { name: "Antibes", lat: 43.5808, lng: 7.1251 },
  hyeres: { name: "Hyères", lat: 43.1204, lng: 6.1286 },
  arles: { name: "Arles", lat: 43.6766, lng: 4.6278 },
  bayonne: { name: "Bayonne", lat: 43.4929, lng: -1.4749 },
  arcachon: { name: "Arcachon", lat: 44.6586, lng: -1.1689 },
  beziers: { name: "Béziers", lat: 43.3444, lng: 3.2158 },
  sete: { name: "Sète", lat: 43.4021, lng: 3.6976 },
};
 
// ---- distance à vol d'oiseau (km) ----
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
 
const DEG2RAD = Math.PI / 180;
const CITY_LIST = Object.keys(CITIES_COORDS).map((key) => {
  const c = CITIES_COORDS[key];
  const latPad = RADIUS_KM / 111;
  const lngPad = RADIUS_KM / (111 * Math.max(Math.cos(c.lat * DEG2RAD), 0.1));
  return {
    key,
    lat: c.lat,
    lng: c.lng,
    latMin: c.lat - latPad,
    latMax: c.lat + latPad,
    lngMin: c.lng - lngPad,
    lngMax: c.lng + lngPad,
  };
});
 
// Trouve la ville Whazup la plus proche d'un point, si elle est à moins de RADIUS_KM — sert à
// attribuer un bar à une seule ville même si la requête Overpass l'a renvoyé via plusieurs
// clauses "around" qui se chevauchent (deux villes proches l'une de l'autre, par ex.).
function nearestCity(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < CITY_LIST.length; i++) {
    const c = CITY_LIST[i];
    if (lat < c.latMin || lat > c.latMax || lng < c.lngMin || lng > c.lngMax) continue;
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestDist) {
      bestDist = d;
      best = c.key;
    }
  }
  return bestDist <= RADIUS_KM ? best : null;
}
 
// ---- construit la requête Overpass QL pour un sous-ensemble de villes (une clause "around"
// par ville, pour les nœuds et "ways" tagués amenity=bar ou amenity=pub). On interroge par
// petits lots séquentiels plutôt qu'avec les 139 villes d'un coup : des tests réels montrent
// qu'Overpass met déjà ~20s à répondre pour seulement 2 villes (dont Paris, dense), et un seul
// énorme appel risquerait de dépasser son propre timeout ou d'être mal vu par ce service public
// gratuit — plusieurs petites requêtes successives sont plus fiables et plus respectueuses.
const CITY_BATCH_SIZE = 12;
 
function buildOverpassQuery(cityBatch) {
  const clauses = cityBatch
    .map((c) => {
      const around = "around:" + RADIUS_KM * 1000 + "," + c.lat + "," + c.lng;
      return (
        '  node["amenity"~"^(bar|pub)$"](' + around + ");\n" +
        '  way["amenity"~"^(bar|pub)$"](' + around + ");"
      );
    })
    .join("\n");
  return "[out:json][timeout:90];\n(\n" + clauses + "\n);\nout center tags;";
}
 
function idFromOsm(type, id) {
  return "osm-" + type + "-" + id;
}
 
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}
 
// ---- interroge Overpass par lots séquentiels, et convertit chaque élément taggé en entrée
// "lieu" Whazup. Le dédoublonnage (par type+id OSM) se fait sur l'ensemble des lots, au cas où
// deux villes voisines renverraient le même bar dans deux lots différents. ----
async function fetchAndFilter() {
  const allCities = Object.values(CITIES_COORDS);
  const batches = chunk(allCities, CITY_BATCH_SIZE);
 
  const seen = new Set();
  const matches = [];
  const byCity = {};
  let elementCount = 0;
 
  for (const batch of batches) {
    const query = buildOverpassQuery(batch);
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "whazup-osm-bars-sync (contact: bot@whazup.fr)",
      },
      body: "data=" + encodeURIComponent(query),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error("Requête Overpass échouée : HTTP " + res.status + " — " + errText.slice(0, 300));
    }
    const data = await res.json();
    const elements = data.elements || [];
    elementCount += elements.length;
 
    for (const el of elements) {
      const tags = el.tags || {};
      const title = (tags.name || "").trim();
      if (!title) continue; // on écarte les bars sans nom (peu utiles à afficher)
 
      // Un "node" a lat/lon directement ; un "way" (bâtiment) a son centre dans "center" grâce
      // à "out center" dans la requête.
      const lat = el.type === "node" ? el.lat : el.center && el.center.lat;
      const lng = el.type === "node" ? el.lon : el.center && el.center.lon;
      if (!isFinite(lat) || !isFinite(lng)) continue;
 
      const dedupeKey = el.type + "/" + el.id;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
 
      const cityKey = nearestCity(lat, lng);
      if (!cityKey) continue;
 
      const cityInfo = CITIES_COORDS[cityKey];
      const street = tags["addr:street"] || "";
      const housenumber = tags["addr:housenumber"] || "";
      const commune = tags["addr:city"] || cityInfo.name;
      const address = (housenumber ? housenumber + " " : "") + street;
 
      const descParts = [];
      if (tags.cuisine) descParts.push("Spécialité : " + tags.cuisine.replace(/_/g, " "));
      if (tags["contact:website"] || tags.website) descParts.push(tags["contact:website"] || tags.website);
      const description = (descParts.join(" — ") || "Bar référencé sur OpenStreetMap.").slice(0, MAX_DESCRIPTION_LEN);
 
      matches.push({
        id: idFromOsm(el.type, el.id),
        isPlace: true,
        scene: "village",
        city: cityKey,
        category: BAR_CATEGORY,
        title,
        date: null,
        time: "",
        place: (address || commune) + ", " + commune,
        lat,
        lng,
        price: "Voir sur place",
        thumb: "",
        source: "openstreetmap",
        createdAt: Date.now(),
        description,
      });
      byCity[cityKey] = (byCity[cityKey] || 0) + 1;
    }
  }
 
  return { elementCount, matches, byCity };
}
 
// ---- encodage base64 sûr pour un texte UTF-8 potentiellement volumineux ----
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
 
async function githubRequest(env, method, path, body) {
  const owner = env.GITHUB_OWNER || "Ericsosohugo1996";
  const repo = env.GITHUB_REPO || "whats-happen-pilote";
  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "whazup-osm-bars-sync",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}
 
async function commitBarsFile(env, jsonString) {
  let sha;
  const getRes = await githubRequest(env, "GET", OUTPUT_PATH);
  if (getRes.ok) {
    const info = await getRes.json();
    sha = info.sha;
  } else if (getRes.status !== 404) {
    throw new Error("Lecture du fichier GitHub existant échouée : HTTP " + getRes.status);
  }
 
  const body = {
    message: "Mise à jour automatique des bars OpenStreetMap (" + new Date().toISOString().slice(0, 10) + ")",
    content: utf8ToBase64(jsonString),
    committer: { name: "Whazup Bot", email: "bot@whazup.fr" },
  };
  if (sha) body.sha = sha;
 
  const putRes = await githubRequest(env, "PUT", OUTPUT_PATH, body);
  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error("Commit GitHub échoué : HTTP " + putRes.status + " — " + errText.slice(0, 500));
  }
  return putRes.json();
}
 
async function runSync(env) {
  const { elementCount, matches, byCity } = await fetchAndFilter();
  const jsonString = JSON.stringify(matches);
  await commitBarsFile(env, jsonString);
  return {
    elementsFromOverpass: elementCount,
    barsRetained: matches.length,
    byCity,
    sizeKB: Math.round(jsonString.length / 1024),
  };
}
 
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env));
  },
  async fetch(request, env) {
    try {
      const result = await runSync(env);
      return new Response(JSON.stringify(result, null, 2), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return new Response("Erreur : " + err.message, { status: 500 });
    }
  },
};
 
