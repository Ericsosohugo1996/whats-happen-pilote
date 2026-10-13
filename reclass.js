// Range les événements « Festival » fourre-tout (DATAtourisme, Ville de Paris) dans la bonne catégorie.
// Seuls les vrais festivals restent « Festival ». Ce qu'on ne peut pas deviner devient « Divers »
// (visible dans « Tout voir » et la recherche, mais sans rubrique à part).
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const RULES = [
  ["Brocante", /brocante|vide.?grenier|vide.?dressing|bourse aux/],
  ["Marché", /\bmarche\b(?! (nordique|aquatique|active))|marche de noel|marche (aux|des)|\bfoire\b|\bpuces\b/],
  ["Sport", /\bmatch\b|\btrail\b|\bcourse\b|marathon|tournoi|randonnee|\brando\b|\bvelo\b|football|rugby|basket|handball|volley|tennis|natation|\bgym\b|yoga|escalade|\bski\b|equidays|horse|triathlon|cyclo|petanque|foulees|pilates|fitness/],
  ["Soirée", /soiree|\bbal\b|blind.?test|karaoke|\bquiz\b|apero|afterwork|\bdj\b|dj set|dancing|dansant|clubbing/],
  ["Musique", /concert|quatuor|quintette|orchestre|\bopera\b|choeur|chorale|recital|\bjazz\b|symphon|musicien|\blive\b|musique|chanson|fanfare|harmonie|\bjam\b|\bsolo\b|\brock\b|\brap\b|\bslam\b|gospel|\bblues\b|\bfolk\b/],
  ["Famille", /\benfants?\b|\bfamille|\bbebes?\b|tout.?petits?|jeune public|\bpetits?\b|\bmini\b|des \d+ ans|\d+ ?(a|-) ?\d+ ans|chasse aux (oeufs|tresor|bonbons)|halloween|ludique|ferme pedagogique|kamishibai|\bgoute\b|parents?|centre de loisirs|ateliers? (parent|enfant)|\bconte|histoires? (pour|a|de)|heure du conte|marionnette|creche|noel|pere noel/],
  ["Spectacles", /spectacle|theatre|comedie|humour|one.?man|stand.?up|cirque|marionnette|improvisation|\bimpro\b|\bdanse\b|ballet|\bconte\b|clown|magie|cabaret|comedy|cinema|\bfilm\b|projection|catch d/],
  ["Expo", /exposition|\bexpo\b|vernissage|visite|musee|patrimoine|atelier|\bstage\b|conference|dedicace|\blecture\b|salon|repair|decouverte|balade|parcours|escape/],
];
// Deuxième passage : ce qui est resté sans catégorie (« Divers ») est rangé avec des mots plus larges.
const RULES2 = [
  ["Brocante", /braderie|\btroc\b|bourse (aux|de)|puces/],
  ["Soirée", /\bloto\b|halloween.*(soiree|party|nuit|bal|dj|fete|boum)|(soiree|party|nuit|bal|dj|boum).*halloween|fete de la biere|oktoberfest|\bnuit\b|\bparty\b|\bclubbing|\bafters?\b|\bboum\b|\bsoiree|guinguette|bodega|\bpub\b|cocktail|\bshow\b.*(drag|cabaret)|\\bdrag\\b/],
  ["Sport", /initiation (au|a la|aux)? ?(golf|tennis|escalade|ski|voile|kayak|surf|plongee|tir|equitation|athletisme)|marche nordique|marche aquatique|aquagym|patinoire|\bgolf\b|\bvoile\b|kayak|\bsurf\b|equitation|\bcourse a pied|sortie (velo|vtt)|\bvtt\b|sport|ping.?pong|badminton|boxe|judo|danse sportive|zumba|randonnee|\bbalade (a|en) (velo|vtt)/],
  ["Musique", /piano|violon|violoncelle|guitare|saxophone|\borgue\b|\btrio\b|quatuor|choeur|chorale|chanteu|melodies|musical|\bswing\b|tango|flamenco|reggae|electro|\bdj\b|\bbal folk|orchestre|harpe|accordeon|ensemble vocal|\bsolo\b|chants?\b|\bvoix\b|trompette|batucada|concert|\blive\b/],
  ["Spectacles", /\bscene\b|spectacle|\bconte|contes|histoires? (pour|a|de)|heure du conte|marionnette|theatre|\bshow\b|cabaret|\bcine|cinema|\bfilm|projection|compagnie|magie|humour|clown|mime|lecture (spectacle|theatrale)|improvis|danse|ballet|cirque|conteur|kamishibai/],
  ["Marché", /degustation|vignoble|champagne|\bvins?\b|saveurs|terroir|\bcave\b|vendanges|fromage|oenolog|producteurs?|marche|foire|ferme ouverte|\bferme\b.*(visite|ouverte)|gourmand|brunch|cidre|pressoir|\bmiel\b/],
  ["Expo", /visite|chateau|domaine|patrimoine|journees? (europeennes|du patrimoine|portes)|portes ouvertes|bibliotheque|mediatheque|lecture|rencontre|conference|atelier|exposition|decouverte|nature|oiseaux|jardin|musee|stage|initiation|cafe (des|philo|lecture|conversation)|jeux de societe|\bjeux\b|escape|chasse au tresor|parcours|circuit|balade|sortie|animation|exploration|ateliers|creation|couture|peinture|dessin|poterie|\bart\b|atelier/],
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
  for (const [cat, rx] of RULES2) {
    if (cat === "Sport" && /impro/.test(t)) continue;
    if (cat === "Soirée" && NOT_SOIREE.test(t)) continue;
    if (rx.test(t)) return cat;
  }
  // dernier recours : le lieu (une salle de concert reste un concert, même si le titre n'est qu'un nom d'artiste)
  const pl = fold(ev.place);
  if (/salle de concerts?|zenith|olympia|\bcigale\b|bataclan|trianon|\bsmac\b|scene de musiques|philharmoni|auditorium|cafe.?concert|\bopera\b|\brocher\b|laiterie|krakatoa|\bcabaret\b|\bjazz\b/.test(pl)) return "Musique";
  if (/theatre|comedie|scene nationale|\bcirque\b|cratere|palais des congres|\bcc\b|centre culturel|espace culturel|salle des fetes/.test(pl)) return "Spectacles";
  if (/\bmusee\b|galerie|\bchateau\b|abbaye|\bfort\b/.test(pl)) return "Expo";
  return "Divers";
}
module.exports = { reclassify };
