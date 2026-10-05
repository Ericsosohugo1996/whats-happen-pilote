// ============================================================================
// museum-places-restaure.js — lieux "à voir" des anciens lots de musées (lots 2 à 13)
// ============================================================================
// Ces lots avaient été écrasés dans museum-places.js (qui ne contient plus que le dernier).
// Ils sont restaurés ici depuis l'historique GitHub, SANS les lieux déjà présents dans
// datatourisme-places.json (même ville, titre identique ou très proche) pour éviter les doublons.
// Chaque lot s'ajoute à allEvents() comme dans museum-places.js.
// ============================================================================

// ---- Lot 2 ----
const CURATED_MUSEUMS_2 = [
  // ---- Tours ----
  { id: "musee2-tours-2", isPlace: true, scene: "expo", city: "tours", category: "À voir", title: "Muséum d'histoire naturelle de Tours", date: null, time: "", place: "3 Rue des Tanneurs, Tours", lat: 47.3930, lng: 0.6870, price: "Payant", thumb: "", description: "Naturalisations, minéraux et vivarium tropical, un musée familial apprécié en plein centre historique de Tours." },
  // ---- Nîmes ----
  { id: "musee2-nimes-2", isPlace: true, scene: "expo", city: "nimes", category: "À voir", title: "Maison Carrée", date: null, time: "", place: "Place de la Maison Carrée, Nîmes", lat: 43.8378, lng: 4.3600, price: "Payant", thumb: "", description: "Temple romain du Ier siècle remarquablement conservé, l'un des mieux préservés au monde, aujourd'hui au cœur de la ville." },
];

const __allEventsBaseMuseums2 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums2(), ...CURATED_MUSEUMS_2];
};

// ---- Lot 3 ----
const CURATED_MUSEUMS_3 = [
  // ---- Perpignan ----
  { id: "musee3-perpignan-2", isPlace: true, scene: "expo", city: "perpignan", category: "À voir", title: "Le Castillet", date: null, time: "", place: "Place de Verdun, Perpignan", lat: 42.6975, lng: 2.8955, price: "Payant", thumb: "", description: "Ancienne porte fortifiée en brique rose, symbole de Perpignan, abritant la Casa Pairal et ses collections catalanes." },
  // ---- Poitiers ----
  { id: "musee3-poitiers-1", isPlace: true, scene: "expo", city: "poitiers", category: "À voir", title: "Baptistère Saint-Jean", date: null, time: "", place: "Rue Jean Jaurès, Poitiers", lat: 46.5820, lng: 0.3390, price: "Payant", thumb: "", description: "L'un des plus anciens édifices chrétiens de France, fondé au IVe siècle, avec ses fresques romanes et ses cuves baptismales." },
  // ---- Annecy ----
  { id: "musee3-annecy-2", isPlace: true, scene: "expo", city: "annecy", category: "À voir", title: "Palais de l'Isle", date: null, time: "", place: "3 Passage de l'Isle, Annecy", lat: 45.9005, lng: 6.1265, price: "Payant", thumb: "", description: "Ancienne prison sur un îlot au milieu du canal du Thiou, l'un des monuments les plus photographiés de France." },
  // ---- La Rochelle ----
  { id: "musee3-larochelle-1", isPlace: true, scene: "expo", city: "larochelle", category: "À voir", title: "Tours de La Rochelle", date: null, time: "", place: "Quai du Gabut, La Rochelle", lat: 46.1553, lng: -1.1520, price: "Payant", thumb: "", description: "Tour Saint-Nicolas et Tour de la Chaîne encadrant le Vieux-Port, symboles historiques de La Rochelle depuis le Moyen Âge." },
  { id: "musee3-larochelle-2", isPlace: true, scene: "expo", city: "larochelle", category: "À voir", title: "Aquarium La Rochelle", date: null, time: "", place: "Bassin des Grands Yachts, La Rochelle", lat: 46.1533, lng: -1.1548, price: "Payant", thumb: "", description: "L'un des plus grands aquariums privés d'Europe, requins, méduses et faune atlantique au bord du port des yachts." },
];

const __allEventsBaseMuseums3 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums3(), ...CURATED_MUSEUMS_3];
};

// ---- Lot 4 ----
const CURATED_MUSEUMS_4 = [
  // ---- Chartres ----
  { id: "musee4-chartres-1", isPlace: true, scene: "expo", city: "chartres", category: "À voir", title: "Cathédrale Notre-Dame de Chartres", date: null, time: "", place: "16 Cloître Notre-Dame, Chartres", lat: 48.4472, lng: 1.4885, price: "Gratuit", thumb: "", description: "Chef-d'œuvre gothique classé à l'Unesco, célèbre pour ses vitraux du XIIIe siècle et son labyrinthe au sol." },
  { id: "musee4-chartres-2", isPlace: true, scene: "expo", city: "chartres", category: "À voir", title: "Musée des Beaux-Arts de Chartres", date: null, time: "", place: "29 Cloître Notre-Dame, Chartres", lat: 48.4475, lng: 1.4890, price: "Payant", thumb: "", description: "Ancien palais épiscopal juste à côté de la cathédrale, peinture, émaux et clavecins historiques." },
  // ---- Quimper ----
  { id: "musee4-quimper-1", isPlace: true, scene: "expo", city: "quimper", category: "À voir", title: "Cathédrale Saint-Corentin de Quimper", date: null, time: "", place: "Place Saint-Corentin, Quimper", lat: 47.9958, lng: -4.1013, price: "Gratuit", thumb: "", description: "Cathédrale gothique aux flèches élancées, cœur historique de la capitale de la Cornouaille." },
  { id: "musee4-quimper-2", isPlace: true, scene: "expo", city: "quimper", category: "À voir", title: "Musée des Beaux-Arts de Quimper", date: null, time: "", place: "40 Place Saint-Corentin, Quimper", lat: 47.9960, lng: -4.1010, price: "Payant", thumb: "", description: "Belle collection de peinture bretonne et européenne, face à la cathédrale, dans un cadre Belle Époque." },
  // ---- Arras ----
  { id: "musee4-arras-1", isPlace: true, scene: "expo", city: "arras", category: "À voir", title: "Beffroi et Hôtel de ville d'Arras", date: null, time: "", place: "Place des Héros, Arras", lat: 50.2921, lng: 2.7817, price: "Payant", thumb: "", description: "Beffroi gothique classé à l'Unesco dominant les magnifiques places baroques flamandes d'Arras, montée jusqu'au panorama." },
  // ---- Tarbes ----
  { id: "musee4-tarbes-1", isPlace: true, scene: "expo", city: "tarbes", category: "À voir", title: "Musée Massey", date: null, time: "", place: "Jardin Massey, Tarbes", lat: 43.2313, lng: 0.0755, price: "Payant", thumb: "", description: "Musée international des Hussards et Beaux-Arts, installé dans un cloître gothique remonté au cœur du jardin Massey." },
  { id: "musee4-tarbes-2", isPlace: true, scene: "expo", city: "tarbes", category: "À voir", title: "Haras National de Tarbes", date: null, time: "", place: "Avenue Alsace-Lorraine, Tarbes", lat: 43.2280, lng: 0.0720, price: "Payant", thumb: "", description: "Haras historique fondé par Napoléon, berceau du cheval tarbais, écuries du XIXe siècle ouvertes à la visite." },
  // ---- Montauban ----
  { id: "musee4-montauban-1", isPlace: true, scene: "expo", city: "montauban", category: "À voir", title: "Musée Ingres Bourdelle", date: null, time: "", place: "19 Rue de l'Hôtel de Ville, Montauban", lat: 44.0175, lng: 1.3555, price: "Payant", thumb: "", description: "Dans l'ancien palais épiscopal au bord du Tarn, œuvres du peintre Ingres et du sculpteur Bourdelle, natifs de la ville." },
  { id: "musee4-montauban-2", isPlace: true, scene: "expo", city: "montauban", category: "À voir", title: "Place Nationale de Montauban", date: null, time: "", place: "Place Nationale, Montauban", lat: 44.0178, lng: 1.3545, price: "Gratuit", thumb: "", description: "Grande place à arcades de brique rose du XVIIe siècle, emblème architectural du centre historique de Montauban." },
];

const __allEventsBaseMuseums4 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums4(), ...CURATED_MUSEUMS_4];
};

// ---- Lot 8 ----
const CURATED_MUSEUMS_8 = [
  // ---- Gap ----
  { id: "musee8-gap-1", isPlace: true, scene: "expo", city: "gap", category: "À voir", title: "Musée Muséum départemental de Gap", date: null, time: "", place: "Avenue du Maréchal Foch, Gap", lat: 44.5605, lng: 6.0790, price: "Gratuit", thumb: "", description: "Histoire naturelle et Beaux-Arts des Hautes-Alpes, dans un parc arboré au cœur de Gap." },
  // ---- Lons-le-Saunier ----
  { id: "musee8-lons-2", isPlace: true, scene: "expo", city: "lons", category: "À voir", title: "Puits Salé", date: null, time: "", place: "Place de la Liberté, Lons-le-Saunier", lat: 46.6748, lng: 5.5495, price: "Gratuit", thumb: "", description: "Ancien puits d'exploitation du sel sous arcades du XVIIe siècle, à l'origine du nom et de la fortune de la ville." },
  // ---- Mont-de-Marsan ----
  { id: "musee8-montdemarsan-2", isPlace: true, scene: "expo", city: "montdemarsan", category: "À voir", title: "Donjon Lacataye", date: null, time: "", place: "Place Marguerite de Navarre, Mont-de-Marsan", lat: 43.8902, lng: -0.4985, price: "Gratuit", thumb: "", description: "Ancien donjon médiéval au confluent de la Midouze, vestige des fortifications de Mont-de-Marsan." },
  // ---- Belfort ----
  { id: "musee8-belfort-1", isPlace: true, scene: "expo", city: "belfort", category: "À voir", title: "Lion de Belfort et Citadelle", date: null, time: "", place: "Rue du Général Négrier, Belfort", lat: 47.6355, lng: 6.8600, price: "Payant", thumb: "", description: "Immense lion de pierre sculpté par Bartholdi, symbole de la résistance de 1870, au pied de la citadelle Vauban." },
  { id: "musee8-belfort-2", isPlace: true, scene: "expo", city: "belfort", category: "À voir", title: "Musée d'Histoire de Belfort", date: null, time: "", place: "Le Château, Belfort", lat: 47.6360, lng: 6.8605, price: "Payant", thumb: "", description: "Collections militaires et Beaux-Arts installées dans les casemates de la citadelle, avec vue panoramique sur la ville." },
];

const __allEventsBaseMuseums8 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums8(), ...CURATED_MUSEUMS_8];
};

// ---- Lot 10 ----
const CURATED_MUSEUMS_10 = [
  // ---- Bar-le-Duc ----
  { id: "musee10-barleduc-2", isPlace: true, scene: "expo", city: "barleduc", category: "À voir", title: "Musée Barrois", date: null, time: "", place: "Rue François de Guise, Bar-le-Duc", lat: 48.7705, lng: 5.1595, price: "Gratuit", thumb: "", description: "Archéologie, sculpture et histoire du Barrois, installé dans l'ancien château des ducs de Bar, en ville haute." },
  // ---- Bourg-en-Bresse ----
  { id: "musee10-bourgenbresse-1", isPlace: true, scene: "expo", city: "bourgenbresse", category: "À voir", title: "Monastère royal de Brou", date: null, time: "", place: "63 Boulevard de Brou, Bourg-en-Bresse", lat: 46.1990, lng: 5.2340, price: "Payant", thumb: "", description: "Joyau du gothique flamboyant, église et cloîtres Renaissance édifiés par Marguerite d'Autriche, l'un des plus beaux monuments de France." },
  { id: "musee10-bourgenbresse-2", isPlace: true, scene: "expo", city: "bourgenbresse", category: "À voir", title: "Musée du Monastère de Brou", date: null, time: "", place: "63 Boulevard de Brou, Bourg-en-Bresse", lat: 46.1992, lng: 5.2342, price: "Payant", thumb: "", description: "Peinture et art sacré dans les anciens bâtiments conventuels du monastère de Brou." },
  // ---- Digne-les-Bains ----
  { id: "musee10-digne-2", isPlace: true, scene: "expo", city: "digne", category: "À voir", title: "Cathédrale Saint-Jérôme de Digne", date: null, time: "", place: "Boulevard Gassendi, Digne-les-Bains", lat: 44.0920, lng: 6.2360, price: "Gratuit", thumb: "", description: "Cathédrale gothique du XVIe siècle, principal édifice religieux du centre-ville de Digne-les-Bains." },
  // ---- Moulins ----
  { id: "musee10-moulins-2", isPlace: true, scene: "expo", city: "moulins", category: "À voir", title: "Centre National du Costume de Scène", date: null, time: "", place: "Route de Montilly, Moulins", lat: 46.5605, lng: 3.3220, price: "Payant", thumb: "", description: "Costumes de spectacle de l'Opéra de Paris et de grandes compagnies, dans une ancienne caserne du Quartier Villars." },
  // ---- Privas ----
  { id: "musee10-privas-1", isPlace: true, scene: "expo", city: "privas", category: "À voir", title: "Vieux Pont de Privas", date: null, time: "", place: "Pont Louis XIII, Privas", lat: 44.7345, lng: 4.5975, price: "Gratuit", thumb: "", description: "Pont historique enjambant l'Ouvèze, vestige emblématique du siège de la ville au XVIIe siècle." },
  { id: "musee10-privas-2", isPlace: true, scene: "expo", city: "privas", category: "À voir", title: "Ruines du Château de Privas", date: null, time: "", place: "Colline du Château, Privas", lat: 44.7365, lng: 4.5995, price: "Gratuit", thumb: "", description: "Vestiges du château détruit par Richelieu, offrant un point de vue dégagé sur la préfecture ardéchoise." },
  // ---- Saint-Lô ----
  { id: "musee10-stlo-1", isPlace: true, scene: "expo", city: "stlo", category: "À voir", title: "Haras National de Saint-Lô", date: null, time: "", place: "Avenue du Maréchal Juin, Saint-Lô", lat: 49.1160, lng: -1.0870, price: "Payant", thumb: "", description: "Haras historique fondé par Napoléon Ier, reconstruit après-guerre, berceau du cheval de sport Selle Français." },
  { id: "musee10-stlo-2", isPlace: true, scene: "expo", city: "stlo", category: "À voir", title: "Musée des Beaux-Arts de Saint-Lô", date: null, time: "", place: "Place du Champ de Mars, Saint-Lô", lat: 49.1150, lng: -1.0915, price: "Gratuit", thumb: "", description: "Tapisseries et peinture normande, dans une ville largement reconstruite après les bombardements de 1944." },
  // ---- La Roche-sur-Yon ----
  { id: "musee10-laroche-1", isPlace: true, scene: "expo", city: "laroche", category: "À voir", title: "Haras de la Vendée", date: null, time: "", place: "2 Rue du Haras, La Roche-sur-Yon", lat: 46.6740, lng: -1.4270, price: "Payant", thumb: "", description: "Ancien haras national du XIXe siècle, aujourd'hui centre équestre et culturel dédié au cheval en Vendée." },
  { id: "musee10-laroche-2", isPlace: true, scene: "expo", city: "laroche", category: "À voir", title: "Place Napoléon", date: null, time: "", place: "Place Napoléon, La Roche-sur-Yon", lat: 46.6700, lng: -1.4260, price: "Gratuit", thumb: "", description: "Immense place centrale voulue par Napoléon Ier, statue équestre de l'Empereur, cœur de la ville nouvelle qu'il a fait bâtir." },
];

const __allEventsBaseMuseums10 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums10(), ...CURATED_MUSEUMS_10];
};

// ---- Lot 11 ----
const CURATED_MUSEUMS_11 = [
  // ---- Saint-Malo ----
  { id: "musee11-saintmalo-1", isPlace: true, scene: "expo", city: "saintmalo", category: "À voir", title: "Remparts de Saint-Malo", date: null, time: "", place: "Saint-Malo intra-muros", lat: 48.6495, lng: -2.0265, price: "Gratuit", thumb: "", description: "Chemin de ronde de 1,8 km ceinturant la cité corsaire, vue imprenable sur la Manche et les îles au large." },
  { id: "musee11-saintmalo-2", isPlace: true, scene: "expo", city: "saintmalo", category: "À voir", title: "Château de Saint-Malo - Musée d'Histoire", date: null, time: "", place: "Place Chateaubriand, Saint-Malo", lat: 48.6485, lng: -2.0245, price: "Payant", thumb: "", description: "Ancien château des ducs de Bretagne, retraçant l'histoire des corsaires et des grands navigateurs malouins." },
  // ---- Cannes ----
  { id: "musee11-cannes-1", isPlace: true, scene: "expo", city: "cannes", category: "À voir", title: "Palais des Festivals et Allée des Célébrités", date: null, time: "", place: "1 Boulevard de la Croisette, Cannes", lat: 43.5497, lng: 7.0173, price: "Gratuit", thumb: "", description: "Célèbre marches du Festival de Cannes et empreintes de mains de stars, sur la mythique Croisette." },
  { id: "musee11-cannes-2", isPlace: true, scene: "expo", city: "cannes", category: "À voir", title: "Musée de la Castre", date: null, time: "", place: "Le Suquet, Cannes", lat: 43.5510, lng: 7.0128, price: "Payant", thumb: "", description: "Arts du monde et instruments de musique anciens, dans un château médiéval dominant le vieux Cannes." },
  // ---- Mulhouse ----
  { id: "musee11-mulhouse-1", isPlace: true, scene: "expo", city: "mulhouse", category: "À voir", title: "Cité de l'Automobile - Collection Schlumpf", date: null, time: "", place: "192 Avenue de Colmar, Mulhouse", lat: 47.7355, lng: 7.3395, price: "Payant", thumb: "", description: "Plus grande collection automobile du monde, avec plus de 400 véhicules dont de nombreuses Bugatti." },
  // ---- Arles ----
  { id: "musee11-arles-2", isPlace: true, scene: "expo", city: "arles", category: "À voir", title: "Fondation Vincent van Gogh Arles", date: null, time: "", place: "35 Rue du Docteur Fanton, Arles", lat: 43.6760, lng: 4.6285, price: "Payant", thumb: "", description: "Dialogue entre l'œuvre de Van Gogh, qui peignit à Arles, et des artistes contemporains." },
  // ---- Béziers ----
  { id: "musee11-beziers-2", isPlace: true, scene: "expo", city: "beziers", category: "À voir", title: "Canal du Midi - Écluses de Fonséranes", date: null, time: "", place: "Écluses de Fonséranes, Béziers", lat: 43.3305, lng: 3.2020, price: "Gratuit", thumb: "", description: "Escalier de neuf écluses classé à l'Unesco, l'un des ouvrages les plus spectaculaires du Canal du Midi." },
  // ---- Saint-Nazaire ----
  { id: "musee11-stnazaire-2", isPlace: true, scene: "expo", city: "stnazaire", category: "À voir", title: "Escal'Atlantic", date: null, time: "", place: "Base sous-marine, Saint-Nazaire", lat: 47.2685, lng: -2.2140, price: "Payant", thumb: "", description: "Reconstitution immersive de la vie à bord des paquebots transatlantiques, dans la base sous-marine." },
  // ---- Cherbourg-en-Cotentin ----
  { id: "musee11-cherbourg-1", isPlace: true, scene: "expo", city: "cherbourg", category: "À voir", title: "Cité de la Mer", date: null, time: "", place: "Gare Maritime Transatlantique, Cherbourg-en-Cotentin", lat: 49.6435, lng: -1.6205, price: "Payant", thumb: "", description: "Visite du sous-marin Le Redoutable, plus grand sous-marin visitable au monde, dans l'ancienne gare transatlantique." },
];

const __allEventsBaseMuseums11 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums11(), ...CURATED_MUSEUMS_11];
};

// ---- Lot 13 ----
const CURATED_MUSEUMS_13 = [
  // ---- Dieppe ----
  { id: "musee13-dieppe-1", isPlace: true, scene: "expo", city: "dieppe", category: "À voir", title: "Château-Musée de Dieppe", date: null, time: "", place: "Rue de Chastes, Dieppe", lat: 49.9285, lng: 1.0715, price: "Payant", thumb: "", description: "Château du XVe siècle sur la falaise, réputé pour sa collection unique d'ivoires sculptés dieppois." },
  // ---- Deauville ----
  { id: "musee13-deauville-1", isPlace: true, scene: "expo", city: "deauville", category: "À voir", title: "Les Planches de Deauville", date: null, time: "", place: "Promenade des Planches, Deauville", lat: 49.3565, lng: 0.0745, price: "Gratuit", thumb: "", description: "Célèbre promenade en bois le long de la plage, cabines de bain baptisées du nom de stars de cinéma." },
  // ---- Calais ----
  { id: "musee13-calais-1", isPlace: true, scene: "expo", city: "calais", category: "À voir", title: "Cité de la Dentelle et de la Mode", date: null, time: "", place: "135 Quai du Commerce, Calais", lat: 50.9575, lng: 1.8555, price: "Payant", thumb: "", description: "Dans une ancienne usine textile, retrace la tradition dentelière de Calais et son lien avec la mode." },
  { id: "musee13-calais-2", isPlace: true, scene: "expo", city: "calais", category: "À voir", title: "Les Bourgeois de Calais (Rodin)", date: null, time: "", place: "Place du Parc, Calais", lat: 50.9600, lng: 1.8555, price: "Gratuit", thumb: "", description: "Célèbre groupe sculpté d'Auguste Rodin, devant l'hôtel de ville, hommage aux six bourgeois qui sauvèrent la ville en 1347." },
  // ---- Boulogne-sur-Mer ----
  { id: "musee13-boulognesurmer-1", isPlace: true, scene: "expo", city: "boulognesurmer", category: "À voir", title: "Nausicaá, Centre National de la Mer", date: null, time: "", place: "Boulevard Sainte-Beuve, Boulogne-sur-Mer", lat: 50.7245, lng: 1.5940, price: "Payant", thumb: "", description: "Plus grand aquarium d'Europe, requins et écosystèmes marins du monde entier, face à la Manche." },
  // ---- Compiègne ----
  { id: "musee13-compiegne-2", isPlace: true, scene: "expo", city: "compiegne", category: "À voir", title: "Clairière de l'Armistice", date: null, time: "", place: "Route de Soissons, Compiègne", lat: 49.4290, lng: 2.9040, price: "Payant", thumb: "", description: "Lieu de signature de l'armistice de 1918, wagon reconstitué et mémorial dans la forêt de Compiègne." },
  // ---- Épernay ----
  { id: "musee13-epernay-1", isPlace: true, scene: "expo", city: "epernay", category: "À voir", title: "Avenue de Champagne", date: null, time: "", place: "Avenue de Champagne, Épernay", lat: 49.0405, lng: 3.9650, price: "Gratuit", thumb: "", description: "Avenue classée à l'Unesco bordée des plus prestigieuses maisons de champagne, sous laquelle dorment des kilomètres de caves." },
  // ---- Beaune ----
  { id: "musee13-beaune-1", isPlace: true, scene: "expo", city: "beaune", category: "À voir", title: "Hospices de Beaune (Hôtel-Dieu)", date: null, time: "", place: "Rue de l'Hôtel Dieu, Beaune", lat: 47.0245, lng: 4.8395, price: "Payant", thumb: "", description: "Hôpital du XVe siècle aux toits de tuiles vernissées multicolores, l'un des monuments les plus photographiés de Bourgogne." },
  // ---- Annemasse ----
  { id: "musee13-annemasse-1", isPlace: true, scene: "expo", city: "annemasse", category: "À voir", title: "Villa du Parc, centre d'art contemporain", date: null, time: "", place: "4 Avenue des Verchères, Annemasse", lat: 46.1935, lng: 6.2350, price: "Gratuit", thumb: "", description: "Centre d'art contemporain municipal proposant des expositions temporaires, au cœur d'Annemasse." },
  // ---- Hyères ----
  { id: "musee13-hyeres-1", isPlace: true, scene: "expo", city: "hyeres", category: "À voir", title: "Villa Noailles", date: null, time: "", place: "Montée de Noailles, Hyères", lat: 43.1215, lng: 6.1300, price: "Payant", thumb: "", description: "Villa moderniste des années 1920, chef-d'œuvre d'architecture Art déco dominant la vieille ville de Hyères." },
  { id: "musee13-hyeres-2", isPlace: true, scene: "expo", city: "hyeres", category: "À voir", title: "Ruines du Château Saint-Bernard", date: null, time: "", place: "Colline du Château, Hyères", lat: 43.1230, lng: 6.1290, price: "Gratuit", thumb: "", description: "Vestiges d'une forteresse médiévale offrant un panorama sur Hyères, la rade et les îles d'Or." },
  // ---- Arcachon ----
  { id: "musee13-arcachon-1", isPlace: true, scene: "expo", city: "arcachon", category: "À voir", title: "Ville d'Hiver d'Arcachon", date: null, time: "", place: "Ville d'Hiver, Arcachon", lat: 44.6570, lng: -1.1650, price: "Gratuit", thumb: "", description: "Quartier de villas victoriennes du XIXe siècle nichées dans la forêt de pins, classé site remarquable." },
  { id: "musee13-arcachon-2", isPlace: true, scene: "expo", city: "arcachon", category: "À voir", title: "Dune du Pilat", date: null, time: "", place: "Route de la Corniche, Arcachon", lat: 44.5900, lng: -1.2140, price: "Gratuit", thumb: "", description: "Plus haute dune de sable d'Europe, panorama exceptionnel sur le bassin d'Arcachon et l'océan Atlantique." },
];

const __allEventsBaseMuseums13 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums13(), ...CURATED_MUSEUMS_13];
};

