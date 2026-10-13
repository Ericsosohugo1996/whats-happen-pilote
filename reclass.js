// Range les événements « Festival » fourre-tout (DATAtourisme, Ville de Paris) dans la bonne catégorie.
// Seuls les vrais festivals restent « Festival ». Ce qu'on ne peut pas deviner devient « Divers »
// (visible dans « Tout voir » et la recherche, mais sans rubrique à part).
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const RULES = [
  ["Brocante", /brocante|vide.?grenier|vide.?dressing|bourse aux/],
  ["Marché", /\bmarche\b(?! (nordique|aquatique|active))|marche de noel|marche (aux|des)|\bfoire\b|\bpuces\b/],
  ["Sport", /\bmatch\b|\btrail\b|\bcourse\b|marathon|tournoi|randonnee|\brando\b|\bvelo\b|football|rugby|basket|handball|volley|tennis|natation|\bgym\b|yoga|escalade|\bski\b|equidays|horse|triathlon|cyclo|petanque|foulees|pilates|fitness/],
  ["Soirée", /soiree|\bbal\b|blind.?test|karaoke|\bquiz\b|apero|afterwork|\bdj\b|dj set|dancing|dansant|clubbing/],
  ["Musique", /concert|quatuor|quintette|orchestre|opera|choeur|chorale|recital|\bjazz\b|symphon|musicien|\blive\b|musique|chanson|fanfare|harmonie|\bjam\b|\bsolo\b|\brock\b|\brap\b|\bslam\b|gospel|\bblues\b|\bfolk\b/],
  ["Spectacles", /spectacle|theatre|comedie|humour|one.?man|stand.?up|cirque|marionnette|improvisation|\bimpro\b|\bdanse\b|ballet|\bconte\b|clown|magie|cabaret|comedy|cinema|\bfilm\b|projection|catch d/],
  ["Expo", /exposition|\bexpo\b|vernissage|visite|musee|patrimoine|atelier|\bstage\b|conference|dedicace|\blecture\b|salon|repair|decouverte|balade|parcours|escape/],
];
const NOT_SOIREE = /soiree (jeux|conference|debat|lecture|litteraire|information|d'information)|soirees? jeux/;
// Un vrai concert rangé en « Soirée » (ex. titres Shotgun) va dans « Musique ».
// Reste en Soirée tout ce qui sent la fête : DJ, club, soirée, nuit, bal, karaoké, afters, bar...
const CONCERT = /\bconcert|recital|showcase|acoustic|\bjazz\b|release party|\blive\b|\btour\b(?! eiffel)|quatuor|orchestre|\bopera\b/;
const PARTY = /\bdj\b|dj set|\bclub|clubbing|soiree|\bnuit\b|night|\bbal\b|karaoke|\bafters?\b|\bbar\b|apero|afterwork|\bquiz|bingo|blind.?test|dancing|dansant|boum|raclette|fete des|grande fete|\bparty\b(?!.*release)|rave|techno|\bhouse\b|disco/;
function reclassify(ev) {
  if (ev.category === "Soirée" && ev.source !== "ticketmaster") {
    const t0 = fold(ev.title).replace(/release party/g, "release_party");
    if (CONCERT.test(fold(ev.title)) && !PARTY.test(t0.replace(/\blive\b/g, " "))) return "Musique";
    return ev.category;
  }
  if (ev.category !== "Festival") return ev.category;
  if (ev.source !== "datatourisme" && ev.source !== "paris-opendata") return ev.category;
  const t = fold(ev.title);
  if (/festival|\bferia\b|fete de la musique/.test(t) && !/atelier|conference|visite|exposition|stage/.test(t)) return "Festival";
  for (const [cat, rx] of RULES) {
    if (cat === "Soirée" && NOT_SOIREE.test(t)) continue;
    if (cat === "Sport" && /impro/.test(t)) continue;
    if (rx.test(t)) return cat;
  }
  return "Divers";
}
module.exports = { reclassify };
