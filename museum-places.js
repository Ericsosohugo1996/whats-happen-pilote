// ---- musées et lieux "à voir" pour les nouvelles villes moyennes (chantier "Territoires", lot 3, dernier lot) ----
// (Dieppe, Deauville, Calais, Boulogne-sur-Mer, Compiègne, Épernay, Beaune, Annemasse, Hyères, Arcachon)
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
  { id: "musee13-boulognesurmer-2", isPlace: true, scene: "expo", city: "boulognesurmer", category: "À voir", title: "Château-Musée de Boulogne-sur-Mer", date: null, time: "", place: "Rue de Bernet, Boulogne-sur-Mer", lat: 50.7275, lng: 1.6140, price: "Payant", thumb: "", description: "Château médiéval abritant des collections égyptiennes, grecques et des masques d'Alaska, dans la ville haute fortifiée." },
  // ---- Compiègne ----
  { id: "musee13-compiegne-1", isPlace: true, scene: "expo", city: "compiegne", category: "À voir", title: "Château de Compiègne", date: null, time: "", place: "Place du Général de Gaulle, Compiègne", lat: 49.4175, lng: 2.8255, price: "Payant", thumb: "", description: "Ancienne résidence impériale de Napoléon Ier et Napoléon III, appartements d'apparat et musée de la voiture." },
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
