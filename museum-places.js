// ---- musées et lieux "à voir" : dernières villes sans contenu (DOM-TOM + petite couronne parisienne) ----
// (Fort-de-France, Cayenne, Saint-Denis de La Réunion, Basse-Terre, Mamoudzou, Nanterre, Bobigny, Créteil, Cergy)
const CURATED_MUSEUMS_14 = [
  // ---- Fort-de-France (Martinique) ----
  { id: "musee14-fortdefrance-1", isPlace: true, scene: "expo", city: "fortdefrance", category: "À voir", title: "Musée d'Histoire et d'Ethnographie de la Martinique", date: null, time: "", place: "10 Boulevard du Général de Gaulle, Fort-de-France", lat: 14.6035, lng: -61.0730, price: "Payant", thumb: "", description: "Costumes créoles, bijoux traditionnels et histoire de la Martinique, dans une villa coloniale du centre-ville." },
  { id: "musee14-fortdefrance-2", isPlace: true, scene: "expo", city: "fortdefrance", category: "À voir", title: "Bibliothèque Schœlcher", date: null, time: "", place: "Rue Victor Schœlcher, Fort-de-France", lat: 14.6013, lng: -61.0693, price: "Gratuit", thumb: "", description: "Étonnant édifice byzantino-mauresque en fer et céramique, transporté de l'Exposition universelle de 1889 à Fort-de-France." },
  // ---- Cayenne (Guyane) ----
  { id: "musee14-cayenne-1", isPlace: true, scene: "expo", city: "cayenne", category: "À voir", title: "Musée des Cultures Guyanaises", date: null, time: "", place: "52 Rue Madame Suzanne Paille, Cayenne", lat: 4.9370, lng: -52.3260, price: "Payant", thumb: "", description: "Ethnographie amérindienne, bushinenge et créole, pour comprendre la diversité culturelle de la Guyane." },
  { id: "musee14-cayenne-2", isPlace: true, scene: "expo", city: "cayenne", category: "À voir", title: "Place des Palmistes", date: null, time: "", place: "Place des Palmistes, Cayenne", lat: 4.9350, lng: -52.3280, price: "Gratuit", thumb: "", description: "Grande place ombragée de palmiers royaux, cœur historique et social du centre-ville de Cayenne." },
  // ---- Saint-Denis (La Réunion) ----
  { id: "musee14-stdenisreunion-1", isPlace: true, scene: "expo", city: "stdenisreunion", category: "À voir", title: "Muséum d'Histoire Naturelle de La Réunion", date: null, time: "", place: "Jardin de l'État, Saint-Denis", lat: -20.8795, lng: 55.4485, price: "Gratuit", thumb: "", description: "Faune, flore et volcanisme de l'océan Indien, dans un beau jardin colonial planté au XVIIIe siècle." },
  { id: "musee14-stdenisreunion-2", isPlace: true, scene: "expo", city: "stdenisreunion", category: "À voir", title: "Le Barachois", date: null, time: "", place: "Le Barachois, Saint-Denis", lat: -20.8730, lng: 55.4460, price: "Gratuit", thumb: "", description: "Esplanade en bord de mer bordée de vieux canons, lieu de promenade emblématique du front de mer de Saint-Denis." },
  // ---- Basse-Terre (Guadeloupe) ----
  { id: "musee14-basseterre-1", isPlace: true, scene: "expo", city: "basseterre", category: "À voir", title: "Fort Louis Delgrès", date: null, time: "", place: "Fort Louis Delgrès, Basse-Terre", lat: 15.9940, lng: -61.7280, price: "Payant", thumb: "", description: "Forteresse du XVIIe siècle dominant la baie, dédiée à l'histoire militaire et à la mémoire de l'abolition de l'esclavage." },
  { id: "musee14-basseterre-2", isPlace: true, scene: "expo", city: "basseterre", category: "À voir", title: "Cathédrale Notre-Dame-de-Guadeloupe", date: null, time: "", place: "Basse-Terre", lat: 16.0000, lng: -61.7320, price: "Gratuit", thumb: "", description: "Cathédrale du XVIIIe siècle, principal édifice religieux du centre historique de Basse-Terre." },
  // ---- Mamoudzou (Mayotte) ----
  { id: "musee14-mamoudzou-1", isPlace: true, scene: "expo", city: "mamoudzou", category: "À voir", title: "MuMa, Musée de Mayotte", date: null, time: "", place: "Dzaoudzi, en face de Mamoudzou", lat: -12.7869, lng: 45.2864, price: "Gratuit", thumb: "", description: "Premier musée de Mayotte, histoire et cultures de l'île, sur l'îlot de Dzaoudzi accessible par barge depuis Mamoudzou." },
  { id: "musee14-mamoudzou-2", isPlace: true, scene: "expo", city: "mamoudzou", category: "À voir", title: "Marché couvert de Mamoudzou", date: null, time: "", place: "Centre-ville, Mamoudzou", lat: -12.7810, lng: 45.2290, price: "Gratuit", thumb: "", description: "Marché animé au cœur de Mamoudzou, épices, fruits tropicaux et artisanat local mahorais." },
  // ---- Nanterre ----
  { id: "musee14-nanterre-1", isPlace: true, scene: "expo", city: "nanterre", category: "À voir", title: "Musée d'Histoire Urbaine et Sociale de Nanterre", date: null, time: "", place: "Rue du Docteur Foucault, Nanterre", lat: 48.8935, lng: 2.2040, price: "Gratuit", thumb: "", description: "Retrace l'histoire de Nanterre, ville ouvrière puis préfecture des Hauts-de-Seine, à travers objets et photographies." },
  // ---- Bobigny ----
  { id: "musee14-bobigny-1", isPlace: true, scene: "expo", city: "bobigny", category: "À voir", title: "Bourse du Travail de Bobigny", date: null, time: "", place: "1 Place de la Libération, Bobigny", lat: 48.9060, lng: 2.4460, price: "Gratuit", thumb: "", description: "Bâtiment emblématique dessiné par l'architecte brésilien Oscar Niemeyer, symbole architectural de Bobigny." },
  // ---- Créteil ----
  { id: "musee14-creteil-1", isPlace: true, scene: "expo", city: "creteil", category: "À voir", title: "Cathédrale Notre-Dame de Créteil", date: null, time: "", place: "Place des Pyramides, Créteil", lat: 48.7895, lng: 2.4550, price: "Gratuit", thumb: "", description: "Cathédrale contemporaine circulaire, l'une des plus récentes de France, consacrée en 2015." },
  // ---- Cergy ----
  { id: "musee14-cergy-1", isPlace: true, scene: "expo", city: "cergy", category: "À voir", title: "Axe majeur de Cergy", date: null, time: "", place: "Place des Colonnes, Cergy", lat: 49.0380, lng: 2.0640, price: "Gratuit", thumb: "", description: "Immense œuvre monumentale de l'artiste Dani Karavan, tour, colonnes et jardins reliant Cergy-Préfecture à l'île de loisirs." },
];

const __allEventsBaseMuseums14 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums14(), ...CURATED_MUSEUMS_14];
};
