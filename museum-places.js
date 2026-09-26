// ---- musées et lieux "à voir" pour les nouvelles villes moyennes (chantier "Territoires", lot 1) ----
// (Saint-Malo, Cannes, Bayonne, Mulhouse, Arles, Béziers, Saint-Nazaire, Cherbourg-en-Cotentin)
const CURATED_MUSEUMS_11 = [
  // ---- Saint-Malo ----
  { id: "musee11-saintmalo-1", isPlace: true, scene: "expo", city: "saintmalo", category: "À voir", title: "Remparts de Saint-Malo", date: null, time: "", place: "Saint-Malo intra-muros", lat: 48.6495, lng: -2.0265, price: "Gratuit", thumb: "", description: "Chemin de ronde de 1,8 km ceinturant la cité corsaire, vue imprenable sur la Manche et les îles au large." },
  { id: "musee11-saintmalo-2", isPlace: true, scene: "expo", city: "saintmalo", category: "À voir", title: "Château de Saint-Malo - Musée d'Histoire", date: null, time: "", place: "Place Chateaubriand, Saint-Malo", lat: 48.6485, lng: -2.0245, price: "Payant", thumb: "", description: "Ancien château des ducs de Bretagne, retraçant l'histoire des corsaires et des grands navigateurs malouins." },
  // ---- Cannes ----
  { id: "musee11-cannes-1", isPlace: true, scene: "expo", city: "cannes", category: "À voir", title: "Palais des Festivals et Allée des Célébrités", date: null, time: "", place: "1 Boulevard de la Croisette, Cannes", lat: 43.5497, lng: 7.0173, price: "Gratuit", thumb: "", description: "Célèbre marches du Festival de Cannes et empreintes de mains de stars, sur la mythique Croisette." },
  { id: "musee11-cannes-2", isPlace: true, scene: "expo", city: "cannes", category: "À voir", title: "Musée de la Castre", date: null, time: "", place: "Le Suquet, Cannes", lat: 43.5510, lng: 7.0128, price: "Payant", thumb: "", description: "Arts du monde et instruments de musique anciens, dans un château médiéval dominant le vieux Cannes." },
  // ---- Bayonne ----
  { id: "musee11-bayonne-1", isPlace: true, scene: "expo", city: "bayonne", category: "À voir", title: "Cathédrale Sainte-Marie de Bayonne", date: null, time: "", place: "Rue d'Espagne, Bayonne", lat: 43.4935, lng: -1.4755, price: "Gratuit", thumb: "", description: "Cathédrale gothique classée à l'Unesco (chemins de Compostelle), avec son cloître du XIIIe siècle." },
  { id: "musee11-bayonne-2", isPlace: true, scene: "expo", city: "bayonne", category: "À voir", title: "Musée Basque et de l'histoire de Bayonne", date: null, time: "", place: "37 Quai des Corsaires, Bayonne", lat: 43.4945, lng: -1.4740, price: "Payant", thumb: "", description: "Le plus grand musée d'ethnographie basque, dans une maison à colombages au bord de la Nive." },
  // ---- Mulhouse ----
  { id: "musee11-mulhouse-1", isPlace: true, scene: "expo", city: "mulhouse", category: "À voir", title: "Cité de l'Automobile - Collection Schlumpf", date: null, time: "", place: "192 Avenue de Colmar, Mulhouse", lat: 47.7355, lng: 7.3395, price: "Payant", thumb: "", description: "Plus grande collection automobile du monde, avec plus de 400 véhicules dont de nombreuses Bugatti." },
  { id: "musee11-mulhouse-2", isPlace: true, scene: "expo", city: "mulhouse", category: "À voir", title: "Cité du Train", date: null, time: "", place: "2 Rue Alfred de Glehn, Mulhouse", lat: 47.7280, lng: 7.3040, price: "Payant", thumb: "", description: "Plus grand musée ferroviaire d'Europe, locomotives historiques et voitures présidentielles." },
  // ---- Arles ----
  { id: "musee11-arles-1", isPlace: true, scene: "expo", city: "arles", category: "À voir", title: "Amphithéâtre romain d'Arles", date: null, time: "", place: "Rond-Point des Arènes, Arles", lat: 43.6775, lng: 4.6305, price: "Payant", thumb: "", description: "Arènes romaines du Ier siècle classées à l'Unesco, toujours utilisées pour spectacles et courses camarguaises." },
  { id: "musee11-arles-2", isPlace: true, scene: "expo", city: "arles", category: "À voir", title: "Fondation Vincent van Gogh Arles", date: null, time: "", place: "35 Rue du Docteur Fanton, Arles", lat: 43.6760, lng: 4.6285, price: "Payant", thumb: "", description: "Dialogue entre l'œuvre de Van Gogh, qui peignit à Arles, et des artistes contemporains." },
  // ---- Béziers ----
  { id: "musee11-beziers-1", isPlace: true, scene: "expo", city: "beziers", category: "À voir", title: "Cathédrale Saint-Nazaire de Béziers", date: null, time: "", place: "Rue du Capus, Béziers", lat: 43.3438, lng: 3.2145, price: "Gratuit", thumb: "", description: "Cathédrale fortifiée dominant les gorges de l'Orb, vue spectaculaire depuis les jardins des Évêchés." },
  { id: "musee11-beziers-2", isPlace: true, scene: "expo", city: "beziers", category: "À voir", title: "Canal du Midi - Écluses de Fonséranes", date: null, time: "", place: "Écluses de Fonséranes, Béziers", lat: 43.3305, lng: 3.2020, price: "Gratuit", thumb: "", description: "Escalier de neuf écluses classé à l'Unesco, l'un des ouvrages les plus spectaculaires du Canal du Midi." },
  // ---- Saint-Nazaire ----
  { id: "musee11-stnazaire-1", isPlace: true, scene: "expo", city: "stnazaire", category: "À voir", title: "Écomusée de Saint-Nazaire", date: null, time: "", place: "Base sous-marine, Saint-Nazaire", lat: 47.2680, lng: -2.2135, price: "Payant", thumb: "", description: "Histoire du port et des chantiers navals, à l'intérieur de l'ancienne base sous-marine allemande." },
  { id: "musee11-stnazaire-2", isPlace: true, scene: "expo", city: "stnazaire", category: "À voir", title: "Escal'Atlantic", date: null, time: "", place: "Base sous-marine, Saint-Nazaire", lat: 47.2685, lng: -2.2140, price: "Payant", thumb: "", description: "Reconstitution immersive de la vie à bord des paquebots transatlantiques, dans la base sous-marine." },
  // ---- Cherbourg-en-Cotentin ----
  { id: "musee11-cherbourg-1", isPlace: true, scene: "expo", city: "cherbourg", category: "À voir", title: "Cité de la Mer", date: null, time: "", place: "Gare Maritime Transatlantique, Cherbourg-en-Cotentin", lat: 49.6435, lng: -1.6205, price: "Payant", thumb: "", description: "Visite du sous-marin Le Redoutable, plus grand sous-marin visitable au monde, dans l'ancienne gare transatlantique." },
  { id: "musee11-cherbourg-2", isPlace: true, scene: "expo", city: "cherbourg", category: "À voir", title: "Basilique Sainte-Trinité de Cherbourg", date: null, time: "", place: "Place de la Trinité, Cherbourg-en-Cotentin", lat: 49.6390, lng: -1.6220, price: "Gratuit", thumb: "", description: "Basilique gothique flamboyant du XVe siècle, principal édifice religieux du centre-ville de Cherbourg." },
];

const __allEventsBaseMuseums11 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums11(), ...CURATED_MUSEUMS_11];
};
