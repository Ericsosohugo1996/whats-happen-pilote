// ---- bars et lieux de sortie en soirée, toujours ouverts (pas datés) ----
const CURATED_BARS = [
  { id: "bar-nantes-1", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.8, title: "Le Bootlegger", date: null, time: "", place: "Rue de la Juiverie, Nantes", lat: 47.2148, lng: -1.5522, price: "€€", thumb: "", description: "Caché derrière une discrète façade, ce speakeasy plonge dans l'univers des bars clandestins américains, cocktails précis entre classiques et créations originales." },
  { id: "bar-nantes-2", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.8, title: "Le Gobe-mouche", date: null, time: "", place: "Rue des Hauts Pavés, Nantes", lat: 47.2200, lng: -1.5580, price: "€", thumb: "", description: "Bar de quartier apprécié pour sa convivialité, clientèle locale fidèle, bières variées et planches gourmandes copieuses." },
  { id: "bar-nantes-3", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.7, title: "Mai Tai", date: null, time: "", place: "Nantes", lat: 47.2150, lng: -1.5540, price: "€€", thumb: "", description: "Escale polynésienne en plein centre de Nantes, déco exotique et carte de cocktails tiki, musique lounge et verres colorés." },
  { id: "bar-nantes-4", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "vin", rating: 4.7, title: "La Déshaltère", date: null, time: "", place: "Place de la Galarne, Nantes", lat: 47.2155, lng: -1.5545, price: "€€", thumb: "", description: "Marie habilement vins, bières locales et produits du terroir, décoration boisée et ambiance conviviale sans prétention." },
  { id: "bar-nantes-5", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.7, title: "Bubar", date: null, time: "", place: "Rue de la Juiverie, Nantes", lat: 47.2146, lng: -1.5524, price: "€", thumb: "", description: "Micro-brasserie artisanale où les bières sont brassées sur place, ambiance joyeuse du comptoir, passion et créativité." },
  { id: "bar-nantes-6", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.6, title: "Le Caf'K", date: null, time: "", place: "Nantes", lat: 47.2140, lng: -1.5555, price: "€€", thumb: "", description: "Paradis liquide du rhum avec plus de 200 références, dégustations guidées, déco entre bois foncé et ambiance caribéenne." },
  { id: "bar-nantes-7", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.6, title: "Les BerThoM", date: null, time: "", place: "Nantes", lat: 47.2130, lng: -1.5570, price: "€", thumb: "", description: "Chaîne aimée des amateurs de bières, décor boisé et chaleureux, classiques belges et découvertes artisanales." },
  { id: "bar-nantes-8", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.5, title: "Little Atlantique Brewery", date: null, time: "", place: "Quai des Antilles, Nantes", lat: 47.2055, lng: -1.5650, price: "€€", thumb: "", description: "Micro-brasserie monumentale dans une ancienne usine, architecture industrielle, bières maison et terrasse vue Loire." },
  { id: "bar-nantes-9", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "live", rating: 4.5, title: "L'Art Scène", date: null, time: "", place: "Rue du Château, Nantes", lat: 47.2140, lng: -1.5518, price: "€", thumb: "", description: "Bar rock par excellence, concerts live, déco underground et ambiance survoltée pour passionnés de musique alternative." },
  { id: "bar-nantes-10", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "live", rating: 4.5, title: "Le Lieu Unique (Le Bar)", date: null, time: "", place: "Nantes", lat: 47.2115, lng: -1.5450, price: "€€", thumb: "", description: "Installé dans l'ancienne biscuiterie LU, centre culturel et bar atypique, concerts, expositions et cocktails en soirée." },
  { id: "bar-nantes-11", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.5, title: "Maria", date: null, time: "", place: "Près de l'Hôtel de Ville, Nantes", lat: 47.2175, lng: -1.5560, price: "€€", thumb: "", description: "Moderne et branchée, décor raffiné et cocktails élégants, mixologues talentueux et ambiance sophistiquée." },
  { id: "bar-nantes-12", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.4, title: "L'Atelier de l'Île", date: null, time: "", place: "Île de Nantes, Nantes", lat: 47.2075, lng: -1.5595, price: "€€", thumb: "", description: "Vue directe sur l'Éléphant des Machines, bières locales ou cocktails, ambiance décontractée et maritime au coucher du soleil." },
  { id: "bar-nantes-13", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "live", rating: 4.4, title: "Le Ferrailleur", date: null, time: "", place: "Quai des Antilles, Nantes", lat: 47.2060, lng: -1.5645, price: "€", thumb: "", description: "Référence nantaise des concerts métal, rock et électro, atmosphère brute et électrique, scène alternative locale." },
  { id: "bar-nantes-14", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.3, title: "John McByrne", date: null, time: "", place: "Rue des Carmes, Nantes", lat: 47.2128, lng: -1.5508, price: "€", thumb: "", description: "L'Irlande en plein cœur de Nantes, esprit convivial et décor boisé typiquement irlandais, bonnes bières et matchs de rugby." },
  { id: "bar-nantes-15", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.3, title: "La Maison", date: null, time: "", place: "Nantes", lat: 47.2135, lng: -1.5580, price: "€€", thumb: "", description: "Décor d'appartement rétro et accueillant, canapés et lampes vintage, bar intimiste qui invite à la détente." },
  { id: "bar-nantes-16", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.3, title: "Gigg's Irish Pub", date: null, time: "", place: "Face à la cathédrale, Nantes", lat: 47.2165, lng: -1.5500, price: "€", thumb: "", description: "Ambiance celtique authentique face à la cathédrale, matchs de sport autour d'une pinte, musique irlandaise conviviale." },
  { id: "bar-nantes-17", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "live", rating: 4.3, title: "Le Dynamo", date: null, time: "", place: "Rue du Maréchal Joffre, Nantes", lat: 47.2168, lng: -1.5485, price: "€", thumb: "", description: "Bar à bières festif où concerts et bonne humeur sont au rendez-vous, programmation musicale variée, clientèle jeune." },
  { id: "bar-nantes-18", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "jeux", rating: 4.2, title: "Le Shaft", date: null, time: "", place: "Rue des Petites Écuries, Nantes", lat: 47.2138, lng: -1.5532, price: "€€", thumb: "", description: "Ambiance moderne et ludique avec jeux, fléchettes et soirées à thème, cocktails bien travaillés pour groupes et afterworks." },
  { id: "bar-nantes-19", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "biere", rating: 4.1, title: "Bar du Coin", date: null, time: "", place: "Rue de la Juiverie, Nantes", lat: 47.2149, lng: -1.5520, price: "€", thumb: "", description: "Adresse populaire et conviviale réunissant habitants du quartier et visiteurs, terrasse animée, accueil chaleureux sans chichi." },
  { id: "bar-nantes-20", isPlace: true, scene: "bar", city: "nantes", category: "Bar", style: "cocktail", rating: 4.0, title: "Le Labo", date: null, time: "", place: "Nantes", lat: 47.2125, lng: -1.5548, price: "€€", thumb: "", description: "Ambiance scientifique et festive, spécialisé dans les cocktails moléculaires, jeux de lumières et univers futuriste." },
  { id: "bar-bordeaux-1", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.7, title: "Symbiose", date: null, time: "", place: "4 Quai des Chartrons, Bordeaux", lat: 44.8480, lng: -0.5720, price: "€€€", thumb: "", description: "Sur les rives de la Garonne, l'un des bars à cocktails les plus sophistiqués de Bordeaux, mixologie et carte évolutive, ambiance intime." },
  { id: "bar-bordeaux-2", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "live", rating: 4.7, title: "L'Apérock Café", date: null, time: "", place: "14 Rue Saint-Rémi, Bordeaux", lat: 44.8400, lng: -0.5730, price: "€", thumb: "", description: "Pleinement rock-bar dans l'âme, affiches et guitares, musique live occasionnelle et soirées à thème, ambiance animée le week-end." },
  { id: "bar-bordeaux-3", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.6, title: "Le Point Rouge", date: null, time: "", place: "1 Quai de Paludate, Bordeaux", lat: 44.8275, lng: -0.5675, price: "€€€", thumb: "", description: "Mélange de bar et cave à vin, longue banquette et éclairage soigné, large sélection de cocktails, whiskies, rhums et gins." },
  { id: "bar-bordeaux-4", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "vin", rating: 4.6, title: "Le Bar à Vin du CIVB", date: null, time: "", place: "3 Cours du 30 Juillet, Bordeaux", lat: 44.8420, lng: -0.5740, price: "€€", thumb: "", description: "Face au Grand Théâtre, sélection de vins locaux au verre à prix raisonnables, salle voûtée en pierre, ambiance élégante et détendue." },
  { id: "bar-bordeaux-5", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.6, title: "L'Autre Petit Bois", date: null, time: "", place: "5 Rue du Cancera, Bordeaux", lat: 44.8395, lng: -0.5735, price: "€€", thumb: "", description: "L'un des bars les plus photographiés de Bordeaux, branches, feuillages et bougies pour une ambiance cabane enchantée." },
  { id: "bar-bordeaux-6", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.5, title: "La Comtesse", date: null, time: "", place: "21 Rue de la Cour des Aides, Bordeaux", lat: 44.8385, lng: -0.5715, price: "€€", thumb: "", description: "Bar à cocktails intimiste niché dans une petite rue du centre historique, éclairage tamisé et créations maison." },
  { id: "bar-bordeaux-7", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "biere", rating: 4.5, title: "The Cock & Bull", date: null, time: "", place: "126 Rue Sainte-Catherine, Bordeaux", lat: 44.8370, lng: -0.5730, price: "€€", thumb: "", description: "Véritable pub anglais sur la plus longue rue commerçante d'Europe, bières pression et écrans pour les matchs de sport." },
  { id: "bar-bordeaux-8", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "biere", rating: 4.5, title: "Les Berthom Bordeaux", date: null, time: "", place: "10 Rue des Piliers de Tutelle, Bordeaux", lat: 44.8402, lng: -0.5716, price: "€", thumb: "", description: "Véritable institution pour les amateurs de bière, large sélection belge et spécialités, équipe qui guide selon vos goûts." },
  { id: "bar-bordeaux-9", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.5, title: "Vintage Bar", date: null, time: "", place: "32 Rue de la Rousselle, Bordeaux", lat: 44.8360, lng: -0.5710, price: "€€", thumb: "", description: "Joue sur l'esthétique rétro, mobilier et affiches d'époque, ambiance chaleureuse dans une rue moins touristique." },
  { id: "bar-bordeaux-10", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "cocktail", rating: 4.5, title: "The Alchemist", date: null, time: "", place: "13 Rue Ravez, Bordeaux", lat: 44.8420, lng: -0.5750, price: "€€€", thumb: "", description: "Prend très au sérieux ses mélanges, textures et présentations, salle intimiste, idéal pour les passionnés de mixologie." },
  { id: "bar-bordeaux-11", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "dansant", rating: 4.4, title: "Le Levrette Café", date: null, time: "", place: "69 Rue de Bègles, Bordeaux", lat: 44.8280, lng: -0.5720, price: "€€", thumb: "", description: "Ambiance festive et accueillante pour lancer l'happy hour entre amis, tournées de verres et bar crawl dans le quartier." },
  { id: "bar-bordeaux-12", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "jeux", rating: 4.4, title: "Wall Street Bar", date: null, time: "", place: "7 Quai de la Douane, Bordeaux", lat: 44.8440, lng: -0.5700, price: "€", thumb: "", description: "Les prix des boissons fluctuent comme en bourse selon la demande, écrans d'affichage et compétition amicale entre clients." },
  { id: "bar-bordeaux-13", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "biere", rating: 4.4, title: "The Sherlock Holmes", date: null, time: "", place: "16 Cours du 30 Juillet, Bordeaux", lat: 44.8422, lng: -0.5742, price: "€€", thumb: "", description: "Pub britannique à thème près du Grand Théâtre, bois sombre et recoins cosy, bières et whiskies bien fournis." },
  { id: "bar-bordeaux-14", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "biere", rating: 4.4, title: "The Red Lion", date: null, time: "", place: "18 Avenue Thiers, Bordeaux", lat: 44.8460, lng: -0.5620, price: "€€", thumb: "", description: "Touche britannique sur la rive droite, boiseries, drapeaux et bière pression, ambiance chaleureuse avec de nombreux habitués." },
  { id: "bar-bordeaux-15", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "dansant", rating: 4.4, title: "Calle Ocho", date: null, time: "", place: "24 Rue des Piliers de Tutelle, Bordeaux", lat: 44.8404, lng: -0.5714, price: "€€", thumb: "", description: "Touche latine sur cette rue déjà animée, musique latino-américaine et cocktails colorés, envie irrésistible de danser." },
  { id: "bar-bordeaux-16", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "rooftop", rating: 4.3, title: "Mama Shelter Rooftop", date: null, time: "", place: "19 Rue Poquelin Molière, Bordeaux", lat: 44.8375, lng: -0.5745, price: "€€", thumb: "", description: "Vue imprenable sur les toits de Bordeaux, déco colorée et ludique, ambiance vacances en ville au coucher du soleil." },
  { id: "bar-bordeaux-17", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "biere", rating: 4.3, title: "Le Grizzly Pub", date: null, time: "", place: "12 Rue des Piliers de Tutelle, Bordeaux", lat: 44.8406, lng: -0.5713, price: "€", thumb: "", description: "L'un des repères clés de cette rue animée, ambiance décidément festive, musique et pintes à la main." },
  { id: "bar-bordeaux-18", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "dansant", rating: 4.3, title: "Iboat", date: null, time: "", place: "Quai Armand Lalande, Bordeaux", lat: 44.8420, lng: -0.5810, price: "€€", thumb: "", description: "Bar et club sur une péniche dans les Bassins à Flot, terrasse en début de soirée puis concerts et clubbing pointus." },
  { id: "bar-bordeaux-19", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "dansant", rating: 4.3, title: "La Tencha", date: null, time: "", place: "22 Quai de la Monnaie, Bordeaux", lat: 44.8330, lng: -0.5670, price: "€", thumb: "", description: "Connu pour ses soirées animées et cocktails abordables, clientèle jeune et énergie vibrante, pour bien démarrer la nuit." },
  { id: "bar-bordeaux-20", isPlace: true, scene: "bar", city: "bordeaux", category: "Bar", style: "vin", rating: 4.3, title: "El Bodegon", date: null, time: "", place: "5 Rue des Piliers de Tutelle, Bordeaux", lat: 44.8408, lng: -0.5717, price: "€€", thumb: "", description: "Touche espagnole sur cette rue déjà riche en bars, comptoir vivant, tapas à partager, vins ibériques et cocktails." },
  { id: "bar-toulouse-1", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Ma Biche sur le Toit", date: null, time: "", place: "4-8 Rue du Lieutenant Colonel Pélissier, Toulouse", lat: 43.6013, lng: 1.4442, price: "€€", thumb: "", description: "Le rooftop le plus connu de Toulouse, perché au 6ᵉ étage des Galeries Lafayette, vue à 360° sur la Ville Rose." },
  { id: "bar-toulouse-2", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Mama Shelter Toulouse", date: null, time: "", place: "Toulouse", lat: 43.6070, lng: 1.4380, price: "€€", thumb: "", description: "Le rooftop de l'hôtel tendance, terrasse panoramique pour siroter des cocktails créatifs au coucher du soleil." },
  { id: "bar-toulouse-3", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Le Perchoir", date: null, time: "", place: "Hôtel des Beaux-Arts, Toulouse", lat: 43.6000, lng: 1.4400, price: "€€", thumb: "", description: "Le concept parisien du rooftop signature s'installe à Toulouse, jardin lush au sommet de l'hôtel." },
  { id: "bar-toulouse-4", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Le Sky Lounge", date: null, time: "", place: "Hôtel Pullman, 9ᵉ étage, Toulouse", lat: 43.6100, lng: 1.4350, price: "€€€", thumb: "", description: "Vue à couper le souffle sur la Garonne depuis le 9ᵉ étage, décor sophistiqué et carte de cocktails étendue." },
  { id: "bar-toulouse-5", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Le Point de Vue", date: null, time: "", place: "Quartier Saint-Cyprien, Toulouse", lat: 43.6000, lng: 1.4350, price: "€€", thumb: "", description: "Perspective imprenable sur le centre historique et la Garonne depuis le quartier Saint-Cyprien." },
  { id: "bar-toulouse-6", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "L'Apoticaire", date: null, time: "", place: "10 Impasse Didier Daurat, Toulouse", lat: 43.6040, lng: 1.4470, price: "€€", thumb: "", description: "Ambiance feutrée façon speakeasy des années 20, mixologistes talentueux et créations uniques." },
  { id: "bar-toulouse-7", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "biere", title: "Le Père Louis", date: null, time: "", place: "Toulouse", lat: 43.6020, lng: 1.4425, price: "€", thumb: "", description: "Institution toulousaine depuis 1889, ce bar-brasserie a traversé les époques sans prendre une ride." },
  { id: "bar-toulouse-8", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "L'Agence", date: null, time: "", place: "26 Rue du Languedoc, Toulouse", lat: 43.5985, lng: 1.4420, price: "€€", thumb: "", description: "Voyage dans les années 20 entre Peaky Blinders et Boardwalk Empire, cocktails signatures et ambiance jazzy." },
  { id: "bar-toulouse-9", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "La Maison", date: null, time: "", place: "Toulouse", lat: 43.6010, lng: 1.4415, price: "€€", thumb: "", description: "Cocktail bar chaleureux avec tapas et cheminée, blind-tests et soirées à thème régulières." },
  { id: "bar-toulouse-10", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "dansant", title: "Fat Cat", date: null, time: "", place: "Rue Gabriel-Péri, Toulouse", lat: 43.6035, lng: 1.4420, price: "€", thumb: "", description: "Référence incontournable des soirées toulousaines dans la très animée rue Gabriel-Péri." },
  { id: "bar-toulouse-11", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "biere", title: "La Distillerie", date: null, time: "", place: "Toulouse", lat: 43.6045, lng: 1.4400, price: "€", thumb: "", description: "Ambiance festive été comme hiver sur une belle et gigantesque terrasse." },
  { id: "bar-toulouse-12", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "dansant", title: "Chez Tempête", date: null, time: "", place: "Toulouse", lat: 43.6025, lng: 1.4435, price: "€€", thumb: "", description: "On y voit la vie en rose, décor haut en couleur et ambiance festive assurée." },
  { id: "bar-toulouse-13", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "Le Loup Blanc", date: null, time: "", place: "Toulouse", lat: 43.6015, lng: 1.4455, price: "€€", thumb: "", description: "Bar à cocktails créatifs, dont le fameux « Wow », dans une ambiance conviviale." },
  { id: "bar-toulouse-14", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "rooftop", title: "Mahogany Club", date: null, time: "", place: "Toulouse", lat: 43.6005, lng: 1.4445, price: "€€€", thumb: "", description: "Vue panoramique sur la skyline toulousaine, ambiance élégante et cocktails élaborés par des mixologistes chevronnés." },
  { id: "bar-toulouse-15", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "biere", title: "Le Biergarten Saint-Michel", date: null, time: "", place: "60 Grande Rue Saint-Michel, Toulouse", lat: 43.5885, lng: 1.4460, price: "€€", thumb: "", description: "Jardin à bières bavarois de 500 m², près d'une centaine de bières et charcuterie venue de Munich." },
  { id: "bar-toulouse-16", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "jeux", title: "George and Dragon", date: null, time: "", place: "Près de la Place du Capitole, Toulouse", lat: 43.6045, lng: 1.4440, price: "€€", thumb: "", description: "Pub anglais authentique et intime ouvert depuis 2007, beerpong, quiz et open mic selon les soirs." },
  { id: "bar-toulouse-17", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "biere", title: "Le Delicatessen", date: null, time: "", place: "Quartier Saint-Aubin, Toulouse", lat: 43.6070, lng: 1.4520, price: "€€", thumb: "", description: "Ambiance steampunk atypique, carte de bières variée et tapas maison renouvelées régulièrement." },
  { id: "bar-toulouse-18", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "biere", title: "La Voile Blanche", date: null, time: "", place: "Bord de Garonne, Toulouse", lat: 43.5960, lng: 1.4380, price: "€€", thumb: "", description: "Au bord de l'eau, panorama et tapas dans une ambiance détente très appréciée aux beaux jours." },
  { id: "bar-toulouse-19", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "L'Arrosoir", date: null, time: "", place: "Rue de Metz, Toulouse", lat: 43.5990, lng: 1.4430, price: "€€", thumb: "", description: "Adresse insolite où l'on se sert soi-même avec un arrosoir, déco végétale et 12 cocktails de saison." },
  { id: "bar-toulouse-20", isPlace: true, scene: "bar", city: "toulouse", category: "Bar", style: "cocktail", title: "Billy Brandy", date: null, time: "", place: "Toulouse", lat: 43.6018, lng: 1.4410, price: "€€", thumb: "", description: "Bar à cocktails prisé du centre historique toulousain, référencé parmi les meilleures adresses de la ville." },
  { id: "bar-lille-1", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.8, title: "La Capsule", date: null, time: "", place: "25 Rue des Trois Mollettes, Lille", lat: 50.6370, lng: 3.0625, price: "€€", thumb: "", description: "Le temple lillois de la bière artisanale, sélection impressionnante de craft beers dans une cave voûtée intimiste." },
  { id: "bar-lille-2", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "cocktail", rating: 4.8, title: "Le Joker Cocktails & Bar", date: null, time: "", place: "32 Place Louise de Bettignies, Lille", lat: 50.6395, lng: 3.0645, price: "€€€", thumb: "", description: "Bar à cocktails haut de gamme réputé pour ses créations sur-mesure, cadre élégant et service attentionné." },
  { id: "bar-lille-3", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.7, title: "L'Illustration", date: null, time: "", place: "18 Rue Royale, Lille", lat: 50.6400, lng: 3.0615, price: "€€", thumb: "", description: "Café-bar historique à l'ambiance bohème, entre vieilles affiches et esprit arty, fréquenté jour et soir." },
  { id: "bar-lille-4", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "jeux", rating: 4.7, title: "La Luck", date: null, time: "", place: "1 bis Rue de la Princesse, Lille", lat: 50.6405, lng: 3.0605, price: "€€", thumb: "", description: "Bar à jeux de société où l'on joue des heures en dégustant bières, cocktails et poutines à la québécoise." },
  { id: "bar-lille-5", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.7, title: "Bierbuik", date: null, time: "", place: "19 Rue Royale, Lille", lat: 50.6398, lng: 3.0618, price: "€€", thumb: "", description: "Estaminet moderne et brewpub signé Florent Ladeyn, bières brassées maison et cuisine de comptoir inventive." },
  { id: "bar-lille-6", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.6, title: "Les BerThoM", date: null, time: "", place: "2 Rue de la Soif, Lille", lat: 50.6280, lng: 3.0575, price: "€", thumb: "", description: "Large choix de bières à la pression dans un cadre soigné, boisé et convivial, styles variés à tester entre amis." },
  { id: "bar-lille-7", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "dansant", rating: 4.6, title: "Atomic Cat", date: null, time: "", place: "6 Cours Saint-Thiébault, Lille", lat: 50.6370, lng: 3.0650, price: "€", thumb: "", description: "Bar alternatif à la déco industrielle et à l'ambiance rock, souvent rythmé par une bande-son énergique." },
  { id: "bar-lille-8", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "cocktail", rating: 4.6, title: "Le Dernier Bar avant la Fin du Monde", date: null, time: "", place: "12 Rue de Pas, Lille", lat: 50.6360, lng: 3.0610, price: "€€", thumb: "", description: "Bar culte pour les fans de culture geek, science-fiction et fantastique, déco immersive et cocktails thématisés." },
  { id: "bar-lille-9", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.5, title: "Camden Bar", date: null, time: "", place: "106 Rue de Saint-André, Lille", lat: 50.6420, lng: 3.0590, price: "€", thumb: "", description: "Ambiance d'un pub londonien, entre rock, bières pression et déco inspirée du Royaume-Uni." },
  { id: "bar-lille-10", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "cocktail", rating: 4.5, title: "Le Quai des Bananes", date: null, time: "", place: "84 Rue Royale, Lille", lat: 50.6402, lng: 3.0612, price: "€€", thumb: "", description: "Spécialiste des cocktails avec une carte immense : rhum, tiki, classiques revisités, décor coloré et festif." },
  { id: "bar-lille-11", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "dansant", rating: 4.5, title: "Mother", date: null, time: "", place: "29 Boulevard Jean-Baptiste Lebas, Lille", lat: 50.6280, lng: 3.0645, price: "€€", thumb: "", description: "Bar moderne combinant food, bières, cocktails et DJ sets, brunchs et afterworks pour une clientèle jeune." },
  { id: "bar-lille-12", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "cocktail", rating: 4.5, title: "L'Imposture", date: null, time: "", place: "99 Rue de l'Hôpital Militaire, Lille", lat: 50.6335, lng: 3.0555, price: "€€", thumb: "", description: "Bar à cocktails et tapas convivial, planches et petites assiettes autour de verres bien dosés." },
  { id: "bar-lille-13", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "dansant", rating: 4.4, title: "La Plage", date: null, time: "", place: "122 Rue Solférino, Lille", lat: 50.6275, lng: 3.0525, price: "€", thumb: "", description: "Bar dansant très prisé des étudiants, ambiance festive jusque tard dans la nuit à Solfé." },
  { id: "bar-lille-14", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.4, title: "The Queen Victoria", date: null, time: "", place: "161 Rue du Molinel, Lille", lat: 50.6260, lng: 3.0560, price: "€€", thumb: "", description: "Pub anglais traditionnel, bois sombre, tireuses et écrans pour le sport, bières britanniques et plats de pub." },
  { id: "bar-lille-15", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.3, title: "Le Tir Na Nog", date: null, time: "", place: "30 Place Philippe Lebon, Lille", lat: 50.6330, lng: 3.0510, price: "€€", thumb: "", description: "Pub irlandais authentique, bières pression, whiskies et musique live occasionnelle autour d'une Guinness." },
  { id: "bar-lille-16", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.3, title: "Le Base Camp", date: null, time: "", place: "10 Rue de la Collégiale, Lille", lat: 50.6345, lng: 3.0600, price: "€€", thumb: "", description: "Ambiance montagne et après-ski, raclettes et montagnardises liquides, esprit chalet très cocooning en hiver." },
  { id: "bar-lille-17", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "rooftop", rating: 4.2, title: "Moxy Lille (Bar)", date: null, time: "", place: "3 Rue Jean Bart, Lille", lat: 50.6370, lng: 3.0755, price: "€€", thumb: "", description: "Bar d'hôtel design à l'atmosphère branchée, rooftop prisé aux beaux jours, décor contemporain pour l'afterwork." },
  { id: "bar-lille-18", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "dansant", rating: 4.1, title: "Le Magazine Club", date: null, time: "", place: "84 Rue de Trévise, Lille", lat: 50.6320, lng: 3.0620, price: "€€", thumb: "", description: "Bar de nuit orienté électro, référence locale pour la musique électronique, DJs et sound system puissant." },
  { id: "bar-lille-19", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "biere", rating: 4.0, title: "La Chicorée", date: null, time: "", place: "15 Place Rihour, Lille", lat: 50.6357, lng: 3.0627, price: "€€", thumb: "", description: "Brasserie iconique de Lille ouverte toute la nuit, le rendez-vous classique des fins de soirée en hyper-centre." },
  { id: "bar-lille-20", isPlace: true, scene: "bar", city: "lille", category: "Bar", style: "dansant", rating: 3.8, title: "Network", date: null, time: "", place: "15 Rue du Faisan, Lille", lat: 50.6345, lng: 3.0640, price: "€€", thumb: "", description: "Institution de la nuit lilloise, orientée danse et ambiance club, piste animée et clientèle festive." },
];

const __allEventsBaseBars = allEvents;
allEvents = function () {
  return [...__allEventsBaseBars(), ...CURATED_BARS];
};

// ---- tri par distance ou par note pour les bars ----
let __barSortMode = "distance";

const __visibleEventsBaseBarSort = visibleEvents;
visibleEvents = function () {
  let events = __visibleEventsBaseBarSort();
  if (state.selectedCategories && state.selectedCategories.has("Bar") && __barSortMode === "rating") {
    events = events.slice().sort(function (a, b) {
      const ra = a.category === "Bar" ? a.rating || 0 : -1;
      const rb = b.category === "Bar" ? b.rating || 0 : -1;
      return rb - ra;
    });
  }
  return events;
};

// ---- filtre par style de bar ----
const BAR_STYLES = [
  { key: "cocktail", label: "🍸 Cocktails" },
  { key: "biere", label: "🍺 Bière/Pub" },
  { key: "rooftop", label: "🌆 Rooftop" },
  { key: "dansant", label: "💃 Dansant" },
  { key: "vin", label: "🍷 Vin" },
  { key: "jeux", label: "🎮 Jeux" },
  { key: "live", label: "🎵 Musique live" },
];
let __selectedBarStyle = null;

const __baseVisibleEventsBarStyle = baseVisibleEvents;
baseVisibleEvents = function () {
  let events = __baseVisibleEventsBarStyle();
  if (__selectedBarStyle) {
    events = events.filter(function (ev) {
      return ev.category !== "Bar" || ev.style === __selectedBarStyle;
    });
  }
  return events;
};

function __ensureBarStyleChips() {
  const filtersPanel = document.getElementById("category-chips");
  if (!filtersPanel || !filtersPanel.parentNode) return;
  const isBarActive = state.selectedCategories && state.selectedCategories.has("Bar");
  let wrap = document.getElementById("bar-style-chips");
  let sortWrap = document.getElementById("bar-sort-buttons");
  if (!isBarActive) {
    if (wrap) wrap.remove();
    if (sortWrap) sortWrap.remove();
    __selectedBarStyle = null;
    __barSortMode = "distance";
    return;
  }
  if (!sortWrap) {
    sortWrap = document.createElement("div");
    sortWrap.id = "bar-sort-buttons";
    sortWrap.style.cssText = "display:flex; gap:6px; margin-top:8px;";
    filtersPanel.parentNode.insertBefore(sortWrap, filtersPanel.nextSibling);
  }
  sortWrap.innerHTML =
    '<button type="button" class="bar-sort-btn" data-sort="distance" style="flex:1; padding:8px 4px; border-radius:10px; border:1px solid ' +
    (__barSortMode === "distance" ? "#14213D" : "rgba(0,0,0,0.15)") +
    "; background:" +
    (__barSortMode === "distance" ? "#14213D" : "#fff") +
    "; color:" +
    (__barSortMode === "distance" ? "#fff" : "inherit") +
    '; font-size:12px; font-weight:600; cursor:pointer;">📍 Plus proche</button>' +
    '<button type="button" class="bar-sort-btn" data-sort="rating" style="flex:1; padding:8px 4px; border-radius:10px; border:1px solid ' +
    (__barSortMode === "rating" ? "#14213D" : "rgba(0,0,0,0.15)") +
    "; background:" +
    (__barSortMode === "rating" ? "#14213D" : "#fff") +
    "; color:" +
    (__barSortMode === "rating" ? "#fff" : "inherit") +
    '; font-size:12px; font-weight:600; cursor:pointer;">⭐ Mieux notés</button>';
  sortWrap.querySelectorAll(".bar-sort-btn").forEach(function (btn) {
    btn.onclick = function () {
      __barSortMode = btn.dataset.sort;
      renderDiscover();
    };
  });

  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "bar-style-chips";
    wrap.style.cssText = "display:flex; gap:6px; overflow-x:auto; margin-top:8px; padding-bottom:2px;";
    sortWrap.parentNode.insertBefore(wrap, sortWrap.nextSibling);
  }
  wrap.innerHTML = BAR_STYLES.map(function (s) {
    const active = __selectedBarStyle === s.key;
    return (
      '<button type="button" class="bar-style-chip" data-style="' +
      s.key +
      '" style="flex:0 0 auto; padding:7px 12px; border-radius:999px; border:1px solid ' +
      (active ? "#14213D" : "rgba(0,0,0,0.15)") +
      "; background:" +
      (active ? "#14213D" : "#fff") +
      "; color:" +
      (active ? "#fff" : "inherit") +
      '; font-size:11.5px; white-space:nowrap; cursor:pointer;">' +
      s.label +
      "</button>"
    );
  }).join("");
  wrap.querySelectorAll(".bar-style-chip").forEach(function (btn) {
    btn.onclick = function () {
      const key = btn.dataset.style;
      __selectedBarStyle = __selectedBarStyle === key ? null : key;
      renderDiscover();
    };
  });
}

const __renderDiscoverBaseBarStyle = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseBarStyle();
  __ensureBarStyleChips();
}
