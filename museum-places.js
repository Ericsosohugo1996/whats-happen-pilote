// ---- musées et lieux "à voir" pour des villes encore non couvertes (lot 7) ----
// (Laon, Gap, Rodez, Auch, Lons-le-Saunier, Mont-de-Marsan, Agen, Belfort)
const CURATED_MUSEUMS_8 = [
  // ---- Laon ----
  { id: "musee8-laon-1", isPlace: true, scene: "expo", city: "laon", category: "À voir", title: "Cathédrale Notre-Dame de Laon", date: null, time: "", place: "Place du Parvis Gautier de Mortagne, Laon", lat: 49.5648, lng: 3.6215, price: "Gratuit", thumb: "", description: "Cathédrale gothique juchée sur sa colline, célèbre pour les sculptures de bœufs ornant ses tours en hommage aux bêtes de trait." },
  { id: "musee8-laon-2", isPlace: true, scene: "expo", city: "laon", category: "À voir", title: "Citadelle de Laon", date: null, time: "", place: "Rue de la Citadelle, Laon", lat: 49.5615, lng: 3.6250, price: "Gratuit", thumb: "", description: "Fortifications Vauban dominant la plaine picarde, vestige militaire de la ville haute médiévale." },
  // ---- Gap ----
  { id: "musee8-gap-1", isPlace: true, scene: "expo", city: "gap", category: "À voir", title: "Musée Muséum départemental de Gap", date: null, time: "", place: "Avenue du Maréchal Foch, Gap", lat: 44.5605, lng: 6.0790, price: "Gratuit", thumb: "", description: "Histoire naturelle et Beaux-Arts des Hautes-Alpes, dans un parc arboré au cœur de Gap." },
  { id: "musee8-gap-2", isPlace: true, scene: "expo", city: "gap", category: "À voir", title: "Cathédrale Notre-Dame-et-Saint-Arnoux de Gap", date: null, time: "", place: "Place du Champsaur, Gap", lat: 44.5598, lng: 6.0800, price: "Gratuit", thumb: "", description: "Cathédrale néo-gothique du XIXe siècle, principal édifice religieux du centre-ville de Gap." },
  // ---- Rodez ----
  { id: "musee8-rodez-1", isPlace: true, scene: "expo", city: "rodez", category: "À voir", title: "Cathédrale Notre-Dame de Rodez", date: null, time: "", place: "Place d'Armes, Rodez", lat: 44.3510, lng: 2.5735, price: "Gratuit", thumb: "", description: "Imposante cathédrale de grès rose, visible depuis toute la vallée, symbole de la ville de Rodez." },
  { id: "musee8-rodez-2", isPlace: true, scene: "expo", city: "rodez", category: "À voir", title: "Musée Soulages", date: null, time: "", place: "Jardin du Foirail, Rodez", lat: 44.3495, lng: 2.5745, price: "Payant", thumb: "", description: "Architecture contemporaine en acier corten dédiée à Pierre Soulages, natif de Rodez, maître de la couleur noire." },
  // ---- Auch ----
  { id: "musee8-auch-1", isPlace: true, scene: "expo", city: "auch", category: "À voir", title: "Cathédrale Sainte-Marie d'Auch", date: null, time: "", place: "Place de la Cathédrale, Auch", lat: 43.6455, lng: 0.5855, price: "Gratuit", thumb: "", description: "Cathédrale classée à l'Unesco, réputée pour ses vitraux Renaissance et ses stalles en bois sculpté." },
  { id: "musee8-auch-2", isPlace: true, scene: "expo", city: "auch", category: "À voir", title: "Escalier monumental et Tour d'Armagnac", date: null, time: "", place: "Escalier Monumental, Auch", lat: 43.6448, lng: 0.5865, price: "Gratuit", thumb: "", description: "Grand escalier de 234 marches reliant la ville basse à la cathédrale, dominé par la tour d'Armagnac médiévale." },
  // ---- Lons-le-Saunier ----
  { id: "musee8-lons-1", isPlace: true, scene: "expo", city: "lons", category: "À voir", title: "Musée des Beaux-Arts de Lons-le-Saunier", date: null, time: "", place: "Rue Rouget de Lisle, Lons-le-Saunier", lat: 46.6745, lng: 5.5510, price: "Gratuit", thumb: "", description: "Peinture du XVIe au XXe siècle dans la ville natale de Rouget de Lisle, auteur de la Marseillaise." },
  { id: "musee8-lons-2", isPlace: true, scene: "expo", city: "lons", category: "À voir", title: "Puits Salé", date: null, time: "", place: "Place de la Liberté, Lons-le-Saunier", lat: 46.6748, lng: 5.5495, price: "Gratuit", thumb: "", description: "Ancien puits d'exploitation du sel sous arcades du XVIIe siècle, à l'origine du nom et de la fortune de la ville." },
  // ---- Mont-de-Marsan ----
  { id: "musee8-montdemarsan-1", isPlace: true, scene: "expo", city: "montdemarsan", category: "À voir", title: "Musée Despiau-Wlérick", date: null, time: "", place: "6 Place Marguerite de Navarre, Mont-de-Marsan", lat: 43.8900, lng: -0.4980, price: "Gratuit", thumb: "", description: "L'un des rares musées entièrement dédiés à la sculpture figurative du XXe siècle, dans l'ancien donjon Lacataye." },
  { id: "musee8-montdemarsan-2", isPlace: true, scene: "expo", city: "montdemarsan", category: "À voir", title: "Donjon Lacataye", date: null, time: "", place: "Place Marguerite de Navarre, Mont-de-Marsan", lat: 43.8902, lng: -0.4985, price: "Gratuit", thumb: "", description: "Ancien donjon médiéval au confluent de la Midouze, vestige des fortifications de Mont-de-Marsan." },
  // ---- Agen ----
  { id: "musee8-agen-1", isPlace: true, scene: "expo", city: "agen", category: "À voir", title: "Musée des Beaux-Arts d'Agen", date: null, time: "", place: "Place du Docteur Esquirol, Agen", lat: 44.2035, lng: 0.6165, price: "Gratuit", thumb: "", description: "L'un des plus riches musées de province du Sud-Ouest, avec des toiles de Goya, dans quatre hôtels Renaissance réunis." },
  { id: "musee8-agen-2", isPlace: true, scene: "expo", city: "agen", category: "À voir", title: "Cathédrale Saint-Caprais d'Agen", date: null, time: "", place: "Place Saint-Caprais, Agen", lat: 44.2040, lng: 0.6200, price: "Gratuit", thumb: "", description: "Ancienne collégiale romane devenue cathédrale, chevet et chapiteaux sculptés remarquables au cœur d'Agen." },
  // ---- Belfort ----
  { id: "musee8-belfort-1", isPlace: true, scene: "expo", city: "belfort", category: "À voir", title: "Lion de Belfort et Citadelle", date: null, time: "", place: "Rue du Général Négrier, Belfort", lat: 47.6355, lng: 6.8600, price: "Payant", thumb: "", description: "Immense lion de pierre sculpté par Bartholdi, symbole de la résistance de 1870, au pied de la citadelle Vauban." },
  { id: "musee8-belfort-2", isPlace: true, scene: "expo", city: "belfort", category: "À voir", title: "Musée d'Histoire de Belfort", date: null, time: "", place: "Le Château, Belfort", lat: 47.6360, lng: 6.8605, price: "Payant", thumb: "", description: "Collections militaires et Beaux-Arts installées dans les casemates de la citadelle, avec vue panoramique sur la ville." },
];

const __allEventsBaseMuseums8 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums8(), ...CURATED_MUSEUMS_8];
};
