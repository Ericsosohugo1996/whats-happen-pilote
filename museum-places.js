// ---- musées et lieux "à voir" pour des villes encore non couvertes ----
// (Lyon, Nice, Toulon, Grenoble, Nancy, Tours, Nîmes, Limoges)
const CURATED_MUSEUMS_2 = [
  // ---- Lyon ----
  { id: "musee2-lyon-1", isPlace: true, scene: "expo", city: "lyon", category: "À voir", title: "Musée des Confluences", date: null, time: "", place: "86 Quai Perrache, Lyon", lat: 45.7305, lng: 4.8172, price: "Payant", thumb: "", description: "Musée d'histoire naturelle et de sciences humaines à l'architecture spectaculaire, à la pointe de la presqu'île entre Rhône et Saône." },
  { id: "musee2-lyon-2", isPlace: true, scene: "expo", city: "lyon", category: "À voir", title: "Musée des Beaux-Arts de Lyon", date: null, time: "", place: "20 Place des Terreaux, Lyon", lat: 45.7679, lng: 4.8358, price: "Payant", thumb: "", description: "L'un des plus riches musées de France, installé dans une ancienne abbaye sur la place des Terreaux, peinture du Moyen Âge à nos jours." },
  // ---- Nice ----
  { id: "musee2-nice-1", isPlace: true, scene: "expo", city: "nice", category: "À voir", title: "Musée Matisse", date: null, time: "", place: "164 Avenue des Arènes de Cimiez, Nice", lat: 43.7218, lng: 7.2764, price: "Gratuit", thumb: "", description: "Collection exceptionnelle d'œuvres d'Henri Matisse dans une villa génoise du quartier de Cimiez, entourée d'oliviers." },
  { id: "musee2-nice-2", isPlace: true, scene: "expo", city: "nice", category: "À voir", title: "Musée national Marc Chagall", date: null, time: "", place: "Avenue Docteur Ménard, Nice", lat: 43.7092, lng: 7.2694, price: "Payant", thumb: "", description: "Plus grand ensemble public au monde d'œuvres de Marc Chagall, conçu par l'artiste lui-même autour du cycle du Message Biblique." },
  // ---- Toulon ----
  { id: "musee2-toulon-1", isPlace: true, scene: "expo", city: "toulon", category: "À voir", title: "Musée d'Art de Toulon (MAT)", date: null, time: "", place: "113 Boulevard du Maréchal Leclerc, Toulon", lat: 43.1246, lng: 5.9310, price: "Gratuit", thumb: "", description: "Peinture et art contemporain, de la Renaissance à aujourd'hui, dans un bel écrin en centre-ville de Toulon." },
  { id: "musee2-toulon-2", isPlace: true, scene: "expo", city: "toulon", category: "À voir", title: "Musée national de la Marine - Toulon", date: null, time: "", place: "Place Monsenergue, Toulon", lat: 43.1189, lng: 5.9280, price: "Payant", thumb: "", description: "Maquettes, figures de proue et histoire de l'arsenal, face au port militaire, pour comprendre la tradition maritime de Toulon." },
  // ---- Grenoble ----
  { id: "musee2-grenoble-1", isPlace: true, scene: "expo", city: "grenoble", category: "À voir", title: "Musée de Grenoble", date: null, time: "", place: "5 Place de Lavalette, Grenoble", lat: 45.1934, lng: 5.7368, price: "Gratuit", thumb: "", description: "L'un des plus grands musées des Beaux-Arts de France hors Paris, avec Picasso, Matisse, Monet et un jardin de sculptures." },
  { id: "musee2-grenoble-2", isPlace: true, scene: "expo", city: "grenoble", category: "À voir", title: "Musée dauphinois", date: null, time: "", place: "30 Rue Maurice Gignoux, Grenoble", lat: 45.1958, lng: 5.7365, price: "Gratuit", thumb: "", description: "Histoire et traditions populaires des Alpes, installé dans un ancien couvent à flanc de colline, avec vue sur la ville." },
  // ---- Nancy ----
  { id: "musee2-nancy-1", isPlace: true, scene: "expo", city: "nancy", category: "À voir", title: "Musée des Beaux-Arts de Nancy", date: null, time: "", place: "3 Place Stanislas, Nancy", lat: 48.6935, lng: 6.1826, price: "Payant", thumb: "", description: "Peinture européenne du XIVe au XXIe siècle et verrerie Daum, directement sur la célèbre place Stanislas classée à l'Unesco." },
  { id: "musee2-nancy-2", isPlace: true, scene: "expo", city: "nancy", category: "À voir", title: "Musée de l'École de Nancy", date: null, time: "", place: "36-38 Rue du Sergent Blandan, Nancy", lat: 48.6890, lng: 6.1690, price: "Payant", thumb: "", description: "Mobilier et arts décoratifs Art nouveau (Gallé, Majorelle) dans une élégante demeure bourgeoise avec son jardin." },
  // ---- Tours ----
  { id: "musee2-tours-1", isPlace: true, scene: "expo", city: "tours", category: "À voir", title: "Musée des Beaux-Arts de Tours", date: null, time: "", place: "18 Place François Sicard, Tours", lat: 47.3947, lng: 0.6920, price: "Payant", thumb: "", description: "Ancien palais épiscopal abritant peintures, sculptures et un cèdre du Liban tricentenaire dans son jardin, juste derrière la cathédrale." },
  { id: "musee2-tours-2", isPlace: true, scene: "expo", city: "tours", category: "À voir", title: "Muséum d'histoire naturelle de Tours", date: null, time: "", place: "3 Rue des Tanneurs, Tours", lat: 47.3930, lng: 0.6870, price: "Payant", thumb: "", description: "Naturalisations, minéraux et vivarium tropical, un musée familial apprécié en plein centre historique de Tours." },
  // ---- Nîmes ----
  { id: "musee2-nimes-1", isPlace: true, scene: "expo", city: "nimes", category: "À voir", title: "Musée de la Romanité", date: null, time: "", place: "16 Boulevard des Arènes, Nîmes", lat: 43.8355, lng: 4.3610, price: "Payant", thumb: "", description: "Bâtiment contemporain à la façade de verre ondulée, face aux arènes, retraçant deux mille ans d'histoire romaine et médiévale de Nîmes." },
  { id: "musee2-nimes-2", isPlace: true, scene: "expo", city: "nimes", category: "À voir", title: "Maison Carrée", date: null, time: "", place: "Place de la Maison Carrée, Nîmes", lat: 43.8378, lng: 4.3600, price: "Payant", thumb: "", description: "Temple romain du Ier siècle remarquablement conservé, l'un des mieux préservés au monde, aujourd'hui au cœur de la ville." },
  // ---- Limoges ----
  { id: "musee2-limoges-1", isPlace: true, scene: "expo", city: "limoges", category: "À voir", title: "Musée national Adrien Dubouché", date: null, time: "", place: "8bis Place Winston Churchill, Limoges", lat: 45.8340, lng: 1.2650, price: "Payant", thumb: "", description: "L'une des plus belles collections de céramique et de porcelaine de Limoges au monde, du Moyen Âge à la création contemporaine." },
  { id: "musee2-limoges-2", isPlace: true, scene: "expo", city: "limoges", category: "À voir", title: "Musée des Beaux-Arts de Limoges (BAL)", date: null, time: "", place: "Place de la Cathédrale, Limoges", lat: 45.8320, lng: 1.2620, price: "Gratuit", thumb: "", description: "Installé dans l'ancien palais épiscopal avec ses jardins en terrasses, égyptologie, émaux limousins et peinture, au bord de la Vienne." },
];

const __allEventsBaseMuseums2 = allEvents;
allEvents = function () {
  return [...__allEventsBaseMuseums2(), ...CURATED_MUSEUMS_2];
};

