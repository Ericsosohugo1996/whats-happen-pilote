// What's happen — pilote web (Phase 1)
// Aucune dépendance externe : tout est en JavaScript natif.
// What's happen — pilote web (Phase 1)
// Aucune dépendance externe : tout est en JavaScript natif.

// ---- écran de démarrage animé ----
(function(){
  const colors = ["#E8604C","#F2C879","#7FA8D9","#ffffff","#C64A38"];
  const burst = document.getElementById("splashConfettiBurst");
  if (!burst) return;
  for (let i = 0; i < 26; i++){
    const el = document.createElement("div");
    el.className = "splash-confetti";
    const angle = (Math.PI*2/26)*i + (Math.random()*0.4);
    const dist = 260 + Math.random()*160;
    el.style.setProperty("--tx", (Math.cos(angle)*dist) + "px");
    el.style.setProperty("--ty", (Math.sin(angle)*dist) + "px");
    el.style.setProperty("--rot", (Math.random()*360) + "deg");
    el.style.background = colors[i % colors.length];
    el.style.borderRadius = ["50%","2px","0"][i % 3];
    burst.appendChild(el);
  }
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 350);
  }, 3400);
})();

// ---- Firebase Authentication ----
// ---- Firebase Authentication ----
const firebaseConfig = {
  apiKey: "AIzaSyCBF51BEU354GbcIAcDVoTSwQHrZ7xHCWQ",
  authDomain: "whazup-46bb4.firebaseapp.com",
  projectId: "whazup-46bb4",
  storageBucket: "whazup-46bb4.firebasestorage.app",
  messagingSenderId: "371962234007",
  appId: "1:371962234007:web:037414d1d756c6b66c15d2"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function showAccountError(message){
  const el = document.getElementById("account-error");
  el.textContent = message;
  el.style.display = "block";
}
function hideAccountError(){
  document.getElementById("account-error").style.display = "none";
}

function renderAccountState(user){
  const loggedOut = document.getElementById("account-logged-out");
  const loggedIn = document.getElementById("account-logged-in");
  const accountBtn = document.getElementById("btn-account");
  if (user){
    loggedOut.classList.add("hidden");
    loggedIn.classList.remove("hidden");
    document.getElementById("account-user-email").textContent = user.email;
    if (accountBtn) accountBtn.textContent = "👤✓";
  } else {
    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");
    if (accountBtn) accountBtn.textContent = "👤";
  }
}
// ---- traduction FR/EN de l'interface (pas du contenu des événements) ----
const TRANSLATIONS = {
  en: {
    "＋ Publier": "＋ Post",
    "Publier": "Post",
    "Explorer": "Explore",
    "Favoris": "Favorites",
    "📍 Ma position": "📍 My location",
    "Ville sélectionnée": "Selected city",
    "Position détectée": "Location detected",
    "📸 Mes photos de": "📸 My photos of",
    "Je suis intéressé(e)": "I'm interested",
    "✓ Vous êtes intéressé(e)": "✓ You're interested",
    "✅ J'y étais (+3 pts)": "✅ I was there (+3 pts)",
    "✅ Confirmé — merci !": "✅ Confirmed — thanks!",
    "📤 Inviter un ami (il reçoit 10 pts de bienvenue)": "📤 Invite a friend (they get 10 welcome pts)",
    "❤️ Mes favoris": "❤️ My favorites",
    "Vous n'avez pas encore de favoris. Ouvrez un événement et appuyez sur le cœur pour l'ajouter ici.": "You don't have any favorites yet. Open an event and tap the heart to add it here.",
    "Nouvel événement": "New event",
    "Publier l'événement": "Publish event",
    "📩 Recevoir les nouveaux événements par email": "📩 Get new events by email",
    "Événement publié !": "Event published!",
    "Retour à l'accueil": "Back to home",
    "⚙️ Filtres": "⚙️ Filters",
    "Catégories :": "Categories:",
    "Rayon rapide :": "Quick radius:",
    "Rayon précis :": "Precise radius:",
    "Tous": "All",
    "Arrondissement :": "District:",
    "Aucun événement ne correspond à ces filtres pour le moment. Essayez d'élargir le rayon ou les catégories.": "No events match these filters right now. Try widening the radius or categories.",
    "📸 Ajouter une photo": "📸 Add a photo",
    "＋ Ajouter une photo": "＋ Add a photo",
    "Pas encore de souvenir ici. Ajoute une photo pour commencer !": "No memories here yet. Add a photo to get started!",
    "☰ Voir la liste": "☰ See the list",
  },
};
const currentLang = { value: localStorage.getItem("wh_lang") || "fr" };

function applyTranslation(){
  const lang = currentLang.value;
  const dict = TRANSLATIONS[lang] || {};
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = lang === "en" && dict[key] ? dict[key] : key;
  });
  const toggleBtn = document.getElementById("btn-lang-toggle");
  if (toggleBtn) toggleBtn.textContent = lang === "en" ? "FR" : "EN";
}

function toggleLang(){
  currentLang.value = currentLang.value === "fr" ? "en" : "fr";
  localStorage.setItem("wh_lang", currentLang.value);
  applyTranslation();
  renderDiscover();
}
const CITIES = {
  aix:  { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  st:   { name: "Saint-Tropez",    lat: 43.2677, lng: 6.6407 },
  ram:  { name: "Ramatuelle",      lat: 43.2135, lng: 6.6155 },
  ste:  { name: "Sainte-Maxime",   lat: 43.3097, lng: 6.6390 },
  lcv:  { name: "La Croix-Valmer", lat: 43.2076, lng: 6.5729 },
  sens: { name: "Sens",            lat: 48.1975, lng: 3.2823 },
   drag: { name: "Draguignan",      lat: 43.5375, lng: 6.4627 },
   moug: { name: "Mougins",         lat: 43.6008, lng: 6.9956 },
   mart: { name: "Martigues",       lat: 43.4056, lng: 5.0487 },
   paris: { name: "Paris",          lat: 48.8566, lng: 2.3522 },
  nantes: { name: "Nantes",        lat: 47.2184, lng: -1.5536 },
  rennes: { name: "Rennes",        lat: 48.1173, lng: -1.6778 },
   brest: { name: "Brest",          lat: 48.3904, lng: -4.4861 },
  bordeaux: { name: "Bordeaux",    lat: 44.8378, lng: -0.5792 },
     toulouse: { name: "Toulouse",    lat: 43.6047, lng: 1.4442 },
  marseille: { name: "Marseille",  lat: 43.2965, lng: 5.3698 },
};

// Événements réels d'août-septembre 2026, reformulés à partir des agendas officiels (offices de
// tourisme d'Aix-en-Provence, de Saint-Tropez, de Ramatuelle, de Sainte-Maxime et de La Croix-Valmer)
// — dates et lieux vérifiés le 21/08/2026. Quelques événements génériques (marchés) complètent la
// liste pour la démonstration.
const SEED_EVENTS = [
  {
    id: "aix-liberation",
    scene: "festival",
    city: "aix",
    category: "Festival",
    title: "82ᵉ anniversaire de la Libération d'Aix-en-Provence",
    date: "2026-08-21",
    time: "18:00",
    place: "Centre-ville, Aix-en-Provence",
    lat: 43.5297, lng: 5.4474,
    price: "Gratuit",
    thumb: "",
    description: "Commémoration de la libération de la ville en 1944 : animations et défilé dans le centre historique.",
  },
  {
    id: "aix-musique-rue",
    scene: "musique",
    city: "aix",
    category: "Musique",
    title: "Festival Musique dans la Rue — soirée de clôture",
    date: "2026-08-21",
    time: "20:00",
    place: "Centre historique, Aix-en-Provence",
    lat: 43.5263, lng: 5.4486,
    price: "Gratuit",
    thumb: "",
    description: "Concerts gratuits dans les rues du centre-ville, pour la dernière soirée de cette édition estivale.",
  },
  {
    id: "aix-apero-ugo",
    scene: "village",
    city: "aix",
    category: "Soirée",
    title: "Les Apéros d'Ugo",
    date: "2026-08-22",
    time: "19:00",
    place: "Terre Ugo, Aix-en-Provence",
    lat: 43.5330, lng: 5.4520,
    price: "Entrée libre",
    thumb: "alt2",
    description: "Rendez-vous gourmand hebdomadaire autour des produits locaux, jusqu'à fin août.",
  },
  {
    id: "aix-vasarely",
    scene: "expo",
    city: "aix",
    category: "Expo",
    title: "Les Ateliers d'été à la Fondation Vasarely",
    date: "2026-08-25",
    time: "10:00",
    place: "Fondation Vasarely, Aix-en-Provence",
    lat: 43.5427, lng: 5.4131,
    price: "Sur inscription",
    thumb: "",
    description: "Ateliers créatifs pour petits et grands autour de l'œuvre de Victor Vasarely.",
  },
  {
    id: "aix-marche",
    scene: "marche",
    city: "aix",
    category: "Marché",
    title: "Marché nocturne provençal",
    date: "2026-08-22",
    time: "18:00",
    place: "Place de l'Hôtel de Ville, Aix-en-Provence",
    lat: 43.5297, lng: 5.4474,
    price: "Entrée libre",
    thumb: "alt",
    description: "Producteurs locaux, artisanat et petite restauration en plein cœur du centre historique d'Aix.",
  },
  {
    id: "aix-marche-fleurs",
    scene: "marche",
    city: "aix",
    category: "Marché",
    title: "Marché aux fleurs du matin",
    date: "2026-08-25",
    time: "08:00",
    place: "Place de l'Hôtel de Ville, Aix-en-Provence",
    lat: 43.5298, lng: 5.4472,
    price: "Entrée libre",
    thumb: "alt",
    description: "Le traditionnel marché aux fleurs matinal, un classique du centre-ville aixois.",
  },
  {
    id: "aix-cinema-plein-air",
    scene: "cinema",
    city: "aix",
    category: "Soirée",
    title: "Cinéma en plein air — Le Voyage de Chihiro",
    date: "2026-08-23",
    time: "21:00",
    place: "Parc du Château de l'Horloge, Aix-en-Provence",
    lat: 43.5285, lng: 5.4437,
    price: "Gratuit",
    thumb: "",
    description: "Projection en plein air dans le parc, dans le cadre du cycle estival de cinéma sous les étoiles.",
  },
  {
    id: "aix-afterwork-rock",
    scene: "musique",
    city: "aix",
    category: "Musique",
    title: "Afterwork Rock en plein air",
    date: "2026-08-27",
    time: "19:00",
    place: "Place Richelme, Aix-en-Provence",
    lat: 43.5283, lng: 5.4468,
    price: "Gratuit",
    thumb: "alt2",
    description: "Concert gratuit en fin de journée sur l'une des places animées du centre historique.",
  },
  {
    id: "aix-patrimoine",
    scene: "chateau",
    city: "aix",
    category: "Expo",
    title: "Journées Européennes du Patrimoine",
    date: "2026-09-19",
    time: "10:00",
    place: "Centre historique, Aix-en-Provence",
    lat: 43.5297, lng: 5.4474,
    price: "Gratuit",
    thumb: "",
    description: "Ouverture exceptionnelle de monuments et lieux habituellement fermés au public, dans toute la ville et le Pays d'Aix.",
  },
  {
    id: "st-moutte",
    scene: "chateau",
    city: "st",
    category: "Festival",
    title: "Les Scènes du Château de la Moutte (4ᵉ édition)",
    date: "2026-08-22",
    time: "21:00",
    place: "Château de la Moutte, Saint-Tropez",
    lat: 43.2600, lng: 6.6550,
    price: "Billetterie sur place",
    thumb: "",
    description: "Festival de spectacles vivants dans le cadre du château : humour, musique et théâtre, avec cette année Elie Semoun et The Black Blues Brothers parmi les têtes d'affiche.",
  },
  {
    id: "st-aoutienne",
    scene: "sport",
    city: "st",
    category: "Sport",
    title: "L'Aoûtienne — Trophée Pourchet",
    date: "2026-08-22",
    time: "10:00",
    place: "Golfe de Saint-Tropez",
    lat: 43.2500, lng: 6.6600,
    price: "Gratuit (spectateurs)",
    thumb: "",
    description: "Régate de voile organisée par la Société Nautique de Saint-Tropez, observable depuis les quais et le sentier du littoral.",
  },
  {
    id: "st-rose-tarte",
    scene: "marche",
    city: "st",
    category: "Marché",
    title: "Rosé & la Tarte Tropézienne",
    date: "2026-08-26",
    time: "11:00",
    place: "Place des Lices, Saint-Tropez",
    lat: 43.2704, lng: 6.6376,
    price: "Entrée libre",
    thumb: "alt",
    description: "Dégustation de rosés locaux et de la fameuse tarte tropézienne, en plein cœur du village.",
  },
  {
    id: "st-marche-port",
    scene: "port",
    city: "st",
    category: "Marché",
    title: "Marché provençal du Port",
    date: "2026-08-22",
    time: "08:00",
    place: "Le Port, Saint-Tropez",
    lat: 43.2730, lng: 6.6410,
    price: "Entrée libre",
    thumb: "alt",
    description: "Le marché historique du village, entre étals de producteurs et vue sur les voiliers du port.",
  },
  {
    id: "st-blues-brothers",
    scene: "chateau",
    city: "st",
    category: "Festival",
    title: "The Black Blues Brothers — Cirque musical",
    date: "2026-08-22",
    time: "21:00",
    place: "Château de la Moutte, Saint-Tropez",
    lat: 43.2600, lng: 6.6550,
    price: "Billetterie sur place",
    thumb: "",
    description: "Spectacle acrobatique et musical déjanté, dans le cadre du festival Les Scènes du Château de la Moutte.",
  },
  {
    id: "st-tribute-elvis",
    scene: "musique",
    city: "st",
    category: "Musique",
    title: "Tribute to Elvis",
    date: "2026-08-23",
    time: "21:00",
    place: "Château de la Moutte, Saint-Tropez",
    lat: 43.2600, lng: 6.6550,
    price: "Billetterie sur place",
    thumb: "alt2",
    description: "Concert hommage au King, toujours dans le cadre du festival du Château de la Moutte.",
  },
  {
    id: "st-voiles",
    scene: "sport",
    city: "st",
    category: "Sport",
    title: "Les Voiles de Saint-Tropez",
    date: "2026-09-26",
    time: "10:00",
    place: "Golfe de Saint-Tropez",
    lat: 43.2677, lng: 6.6407,
    price: "Gratuit (spectateurs)",
    thumb: "",
    description: "La grande régate de yachting classique et moderne qui clôt la saison tropézienne, avec plus de 300 bateaux attendus dans le golfe.",
  },
  {
    id: "ram-festival",
    scene: "festival",
    city: "ram",
    category: "Festival",
    title: "Festival de Ramatuelle",
    date: "2026-08-01",
    time: "21:00",
    place: "Théâtre de verdure, Ramatuelle",
    lat: 43.2138, lng: 6.6130,
    price: "Billetterie sur place",
    thumb: "",
    description: "Rendez-vous théâtral emblématique de la presqu'île depuis 1985, fondé par Jean-Claude Brialy : théâtre, humour et musique dans un amphithéâtre en plein air, jusqu'au 12 août.",
  },
  {
    id: "ram-dj",
    scene: "plage",
    city: "ram",
    category: "Soirée",
    title: "DJ Set — Plage de Pampelonne",
    date: "2026-08-21",
    time: "22:00",
    place: "Plage de Pampelonne, Ramatuelle",
    lat: 43.2214, lng: 6.6614,
    price: "Entrée 15 €",
    thumb: "alt2",
    description: "Coucher de soleil et DJ set sur le sable, dans l'un des spots les plus emblématiques de la presqu'île.",
  },
  {
    id: "ram-cap-camarat",
    scene: "nature",
    city: "ram",
    category: "Sport",
    title: "Randonnée du sentier du littoral — Cap Camarat",
    date: "2026-08-23",
    time: "09:00",
    place: "Cap Camarat, Ramatuelle",
    lat: 43.2050, lng: 6.6890,
    price: "Gratuit",
    thumb: "",
    description: "Randonnée le long du sentier du littoral protégé, jusqu'au phare du Cap Camarat.",
  },
  {
    id: "ram-marche",
    scene: "marche",
    city: "ram",
    category: "Marché",
    title: "Marché de Ramatuelle",
    date: "2026-08-22",
    time: "08:00",
    place: "Place de l'Ormeau, Ramatuelle",
    lat: 43.2135, lng: 6.6155,
    price: "Entrée libre",
    thumb: "alt",
    description: "Marché provençal du village perché : producteurs locaux et artisanat.",
  },
  {
    id: "ram-bal-st-andre",
    scene: "village",
    city: "ram",
    category: "Soirée",
    title: "Bal de la Saint-André et soupe au pistou",
    date: "2026-08-22",
    time: "21:00",
    place: "Place de l'Ormeau, Ramatuelle",
    lat: 43.2135, lng: 6.6155,
    price: "Entrée libre",
    thumb: "alt2",
    description: "Soirée dansante conviviale suivie d'une soupe au pistou partagée, une tradition villageoise de l'été ramatuellois.",
  },
  {
    id: "ram-escalet-melting-potes",
    scene: "plage",
    city: "ram",
    category: "Musique",
    title: "Concerts plage de l'Escalet — Melting Potes",
    date: "2026-08-24",
    time: "21:00",
    place: "Plage de l'Escalet, Ramatuelle",
    lat: 43.2080, lng: 6.6970,
    price: "Gratuit",
    thumb: "",
    description: "Concert gratuit les pieds dans le sable, sur l'une des plus belles plages sauvages de la presqu'île.",
  },
  {
    id: "ram-musique-village",
    scene: "musique",
    city: "ram",
    category: "Musique",
    title: "Musique au village — Lightnin'G-bird & Abdenor Natouri",
    date: "2026-08-27",
    time: "19:00",
    place: "Centre du village, Ramatuelle",
    lat: 43.2135, lng: 6.6155,
    price: "Entrée libre",
    thumb: "alt",
    description: "Petit concert en cœur de village, dans le cadre du programme d'animations estivales.",
  },
  {
    id: "ram-forum-associations",
    scene: "village",
    city: "ram",
    category: "Festival",
    title: "Forum des associations",
    date: "2026-09-04",
    time: "16:00",
    place: "Ramatuelle",
    lat: 43.2135, lng: 6.6155,
    price: "Entrée libre",
    thumb: "",
    description: "Rencontre de rentrée avec les associations locales, pour découvrir les activités proposées dans le village.",
  },
  {
    id: "ste-fete-vendanges",
    scene: "festival",
    city: "ste",
    category: "Festival",
    title: "Fête des Vendanges",
    date: "2026-08-29",
    time: "18:00",
    place: "Vieux village, Sainte-Maxime",
    lat: 43.3095, lng: 6.6385,
    price: "Entrée libre",
    thumb: "",
    description: "Fête traditionnelle marquant les premières vendanges, avec animations et dégustations dans le vieux village.",
  },
  {
    id: "ste-dj-party",
    scene: "musique",
    city: "ste",
    category: "Soirée",
    title: "Summer DJ' Party",
    date: "2026-08-22",
    time: "21:00",
    place: "Port de Sainte-Maxime",
    lat: 43.3103, lng: 6.6398,
    price: "Entrée libre",
    thumb: "alt2",
    description: "Soirée DJ en plein air sur le front de mer, dans le cadre du programme des animations estivales.",
  },
  {
    id: "ste-live-ville",
    scene: "musique",
    city: "ste",
    category: "Musique",
    title: "Live en ville",
    date: "2026-08-25",
    time: "19:00",
    place: "Centre-ville, Sainte-Maxime",
    lat: 43.3100, lng: 6.6392,
    price: "Gratuit",
    thumb: "alt",
    description: "Concert live gratuit dans les rues du centre, pour animer les soirées d'été.",
  },
  {
    id: "ste-concert-classique",
    scene: "musique",
    city: "ste",
    category: "Musique",
    title: "Concert classique — Ravel, Bach, Vivaldi, Rachmaninov, Puccini",
    date: "2026-09-03",
    time: "21:00",
    place: "Théâtre de la Mer, Sainte-Maxime",
    lat: 43.3086, lng: 6.6420,
    price: "Billetterie sur place",
    thumb: "",
    description: "Concert de musique classique en plein air face à la mer, avec un programme mêlant grands compositeurs.",
  },
  {
    id: "ste-reves-auto",
    scene: "expo",
    city: "ste",
    category: "Expo",
    title: "Rêves Auto Sainte-Maxime",
    date: "2026-09-26",
    time: "10:00",
    place: "Théâtre de la Mer, Sainte-Maxime",
    lat: 43.3086, lng: 6.6420,
    price: "Entrée libre",
    thumb: "alt2",
    description: "Exposition de véhicules de collection et de prestige en bord de mer, 3ᵉ édition.",
  },
  {
    id: "ste-part-age-nature",
    scene: "nature",
    city: "ste",
    category: "Sport",
    title: "Part'âge nature — traces et empreintes d'animaux",
    date: "2026-08-22",
    time: "09:30",
    place: "Massif des Maures, Sainte-Maxime",
    lat: 43.3050, lng: 6.6300,
    price: "Gratuit",
    thumb: "",
    description: "Sortie nature en famille à la découverte des traces et empreintes laissées par la faune locale.",
  },
  {
    id: "lcv-taste-chill",
    scene: "village",
    city: "lcv",
    category: "Soirée",
    title: "Taste & Chill",
    date: "2026-08-21",
    time: "19:00",
    place: "Château de Chausse, La Croix-Valmer",
    lat: 43.2090, lng: 6.5760,
    price: "Entrée libre",
    thumb: "alt",
    description: "Soirée dégustation hebdomadaire au château, un rendez-vous convivial de l'été.",
  },
  {
    id: "lcv-soiree-autour-de-france",
    scene: "musique",
    city: "lcv",
    category: "Musique",
    title: "Soirée d'été : Autour de France",
    date: "2026-08-26",
    time: "21:00",
    place: "Forum Constantin, La Croix-Valmer",
    lat: 43.2078, lng: 6.5732,
    price: "Entrée libre",
    thumb: "alt2",
    description: "Concert hommage en plein air, dans le cadre du programme des soirées d'été.",
  },
  {
    id: "lcv-marche-nocturne",
    scene: "marche",
    city: "lcv",
    category: "Marché",
    title: "Marché nocturne",
    date: "2026-08-22",
    time: "16:00",
    place: "Centre-ville, La Croix-Valmer",
    lat: 43.2076, lng: 6.5729,
    price: "Entrée libre",
    thumb: "alt",
    description: "Marché artisanal et gourmand en soirée, un rendez-vous estival du centre-ville.",
  },
  {
    id: "lcv-gigaro-rando",
    scene: "nature",
    city: "lcv",
    category: "Sport",
    title: "Randonnée du sentier du littoral — Cap Lardier",
    date: "2026-08-24",
    time: "09:00",
    place: "Plage de Gigaro, La Croix-Valmer",
    lat: 43.1980, lng: 6.5980,
    price: "Gratuit",
    thumb: "",
    description: "Randonnée dans l'espace naturel protégé du Cap Lardier, entre pinède et criques sauvages.",
  },
  {
    id: "lcv-patrimoine",
    scene: "expo",
    city: "lcv",
    category: "Expo",
    title: "Sur les traces du passé — visite patrimoine",
    date: "2026-08-28",
    time: "17:00",
    place: "Le Village, La Croix-Valmer",
    lat: 43.2076, lng: 6.5729,
    price: "Gratuit",
    thumb: "",
    description: "Visite commentée sur l'histoire de la commune, de la légende de Constantin au débarquement de 1944.",
  },
  {
    id: "sens-brocante-soucy",
    scene: "marche",
    city: "sens",
    category: "Marché",
    title: "Brocante et vide-greniers de Soucy",
    date: "2026-08-23",
    time: "05:30",
    place: "Soucy (à 6 km de Sens)",
    lat: 48.1503, lng: 3.2999,
    price: "Entrée libre",
    thumb: "",
    description: "Grande brocante matinale dans le village voisin de Soucy, une habituée des week-ends de fin d'été dans le Sénonais.",
  },
  {
    id: "sens-journee-famille",
    scene: "festival",
    city: "sens",
    category: "Festival",
    title: "Journée de la Famille",
    date: "2026-08-26",
    time: "11:00",
    place: "Promenade du boulevard Maupéou, Sens",
    lat: 48.1965, lng: 3.2845,
    price: "Gratuit",
    thumb: "",
    description: "Animations, jeux et stands en plein air le long de la promenade, un rendez-vous familial organisé par la ville.",
  },
  {
    id: "sens-nocturne-cathedrale",
    scene: "expo",
    city: "sens",
    category: "Expo",
    title: "Visite guidée nocturne de la cathédrale Saint-Étienne",
    date: "2026-08-29",
    time: "21:00",
    place: "Parvis de la cathédrale, Sens",
    lat: 48.1975, lng: 3.2823,
    price: "Tarif office de tourisme",
    thumb: "",
    description: "Visite commentée de 90 minutes à la tombée de la nuit, dans la première cathédrale gothique de France.",
  },
  {
    id: "sens-tour-sud",
    scene: "sport",
    city: "sens",
    category: "Sport",
    title: "Ascension de la tour sud de la cathédrale",
    date: "2026-08-29",
    time: "14:00",
    place: "Cathédrale Saint-Étienne, Sens",
    lat: 48.1975, lng: 3.2823,
    price: "Tarif office de tourisme",
    thumb: "",
    description: "330 marches jusqu'à 66 mètres de haut, pour un panorama sur la ville et la vallée de l'Yonne.",
  },
  {
    id: "sens-dj-rooftop",
    scene: "village",
    city: "sens",
    category: "Soirée",
    title: "Soirée DJ en rooftop",
    date: "2026-09-05",
    time: "19:00",
    place: "Au Dernier Étage, Sens",
    lat: 48.1978, lng: 3.2836,
    price: "Entrée libre",
    thumb: "",
    description: "Dernière soirée DJ de la saison sur le rooftop du centre-ville, avec bar et petite restauration.",
  },
  {
    id: "sens-brocante-rosoy",
    scene: "marche",
    city: "sens",
    category: "Marché",
    title: "Brocante de Rosoy",
    date: "2026-09-06",
    time: "07:00",
    place: "Place des Marvageuses, Rosoy (à 5 km de Sens)",
    lat: 48.1932, lng: 3.3466,
    price: "Entrée libre",
    thumb: "",
    description: "Brocante dominicale dans le village de Rosoy, à quelques minutes du centre de Sens.",
  },
  {
    id: "sens-nuit-blues",
    scene: "musique",
    city: "sens",
    category: "Musique",
    title: "15e Nuit du Blues",
    date: "2026-09-18",
    time: "20:30",
    place: "Théâtre municipal, Sens",
    lat: 48.1958, lng: 3.2839,
    price: "15€ à 25€",
    thumb: "",
    description: "Concert avec le Vincent Bucher Trio et Nicolle & Dîmes, pour la 15e édition de ce rendez-vous blues sénonais.",
  },
    {
    id: "sens-saint-fiacre",
    scene: "festival",
    city: "sens",
    category: "Festival",
    title: "Fête de la Saint Fiacre",
    date: "2026-09-20",
    time: "10:00",
    place: "Centre historique, Sens",
    lat: 48.1975, lng: 3.2823,
    price: "Gratuit",
    thumb: "",
    description: "Fête patrimoniale et champêtre au cœur de la ville, autour du saint patron des jardiniers.",
  },
  {
    id: "marseille-so-good",
    scene: "festival",
    city: "marseille",
    category: "Festival",
    title: "So Good MAIF Festival",
    date: "2026-09-26",
    time: "10:00",
    place: "Friche la Belle de Mai, Marseille",
    lat: 43.3103, lng: 5.3844,
    price: "Payant",
    thumb: "",
    description: "Une journée engagée et festive autour de la transition écologique et sociale, avec rencontres, conférences, humour et concerts.",
  },
  {
    id: "marseille-marsatac",
    scene: "musique",
    city: "marseille",
    category: "Musique",
    title: "Marsatac",
    date: "2026-09-25",
    time: "18:00",
    place: "Marseille",
    lat: 43.2965, lng: 5.3698,
    price: "Payant",
    thumb: "",
    description: "Référence des musiques actuelles à Marseille : hip-hop, électro et rock dans un esprit résolument urbain.",
  },
  {
    id: "marseille-fiesta-suds",
    scene: "musique",
    city: "marseille",
    category: "Musique",
    title: "Fiesta des Suds — Véronique Sanson, Imany...",
    date: "2026-10-08",
    time: "19:00",
    place: "Esplanade Gisèle Halimi, Marseille",
    lat: 43.3200, lng: 5.3600,
    price: "Payant",
    thumb: "",
    description: "Rendez-vous festif mêlant musiques du monde, concerts et ambiance chaleureuse sur les quais de Marseille.",
  },
  {
    id: "marseille-jep",
    scene: "expo",
    city: "marseille",
    category: "Expo",
    title: "Journées Européennes du Patrimoine",
    date: "2026-09-19",
    time: "10:00",
    place: "Centre historique, Marseille",
    lat: 43.2965, lng: 5.3698,
    price: "Gratuit",
    thumb: "",
    description: "Ouverture exceptionnelle de monuments et lieux habituellement fermés au public, dans toute la ville.",
  },
  {
    id: "marseille-ete-marseillais",
    scene: "village",
    city: "marseille",
    category: "Soirée",
    title: "L'Été Marseillais",
    date: "2026-09-06",
    time: "18:00",
    place: "Marseille",
    lat: 43.2965, lng: 5.3698,
    price: "Gratuit",
    thumb: "",
    description: "Grand rendez-vous populaire et gratuit dans toute la ville : concerts, ciné plein-air, activités nautiques et animations.",
  },
]; 

const CATEGORIES = ["Musique", "Marché", "Festival", "Sport", "Soirée", "Expo"];

// Scène illustrée par défaut selon la catégorie (utilisée pour les événements publiés par les
// utilisateurs, qui n'ont pas de scène assignée manuellement).
const CATEGORY_SCENE = {
  Musique: "musique",
  Marché: "marche",
  Festival: "festival",
  Sport: "sport",
  Soirée: "village",
  Expo: "expo",
};

// ---- illustrations de scène (SVG faits maison, sans photo, pour éviter tout souci de droits) ----
const SCENES = {
  port: `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="66" width="200" height="54" fill="#2f8a90"/>
    <circle cx="168" cy="26" r="14" fill="#f2c869"/>
    <polygon points="30,66 30,40 52,66" fill="#ffffff"/>
    <rect x="26" y="60" width="30" height="14" rx="2" fill="#c1440e"/>
    <line x1="30" y1="66" x2="30" y2="36" stroke="#8f330a" stroke-width="2"/>
    <polygon points="100,66 100,46 118,66" fill="#ffffff"/>
    <rect x="96" y="60" width="26" height="12" rx="2" fill="#1f6f78"/>
    <line x1="100" y1="66" x2="100" y2="42" stroke="#17545a" stroke-width="2"/>
    <polygon points="150,66 150,50 164,66" fill="#ffffff"/>
    <rect x="147" y="60" width="20" height="10" rx="2" fill="#e3a72e"/>
    <line x1="150" y1="66" x2="150" y2="46" stroke="#a9791c" stroke-width="2"/>
  `,
  plage: `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <rect y="58" width="200" height="30" fill="#5db3a0"/>
    <rect y="88" width="200" height="32" fill="#e8cd9a"/>
    <circle cx="34" cy="28" r="16" fill="#e3a72e"/>
    <polygon points="140,100 140,60 176,100" fill="#c1440e"/>
    <rect x="138" y="98" width="4" height="22" fill="#8f330a"/>
    <path d="M60,100 q10,-16 20,0" fill="none" stroke="#ffffff" stroke-width="3"/>
    <path d="M90,106 q10,-16 20,0" fill="none" stroke="#ffffff" stroke-width="3"/>
  `,
  marche: `
    <rect width="200" height="120" fill="#faf6f1"/>
    <polygon points="20,50 50,50 35,26" fill="#c1440e"/>
    <rect x="24" y="50" width="22" height="40" fill="#ffffff" stroke="#e8e1d8"/>
    <polygon points="80,50 110,50 95,22" fill="#1f6f78"/>
    <rect x="84" y="50" width="22" height="44" fill="#ffffff" stroke="#e8e1d8"/>
    <polygon points="140,50 170,50 155,26" fill="#e3a72e"/>
    <rect x="144" y="50" width="22" height="40" fill="#ffffff" stroke="#e8e1d8"/>
    <circle cx="35" cy="98" r="7" fill="#e3a72e"/>
    <circle cx="95" cy="102" r="7" fill="#c1440e"/>
    <circle cx="155" cy="98" r="7" fill="#1f6f78"/>
  `,
  chateau: `
    <rect width="200" height="120" fill="#2c2854"/>
    <circle cx="30" cy="20" r="2" fill="#ffffff"/>
    <circle cx="60" cy="14" r="1.6" fill="#ffffff"/>
    <circle cx="150" cy="18" r="2" fill="#ffffff"/>
    <circle cx="170" cy="30" r="1.4" fill="#ffffff"/>
    <rect x="60" y="52" width="80" height="60" fill="#1c1b1a"/>
    <rect x="50" y="40" width="20" height="72" fill="#1c1b1a"/>
    <rect x="130" y="40" width="20" height="72" fill="#1c1b1a"/>
    <polygon points="50,40 60,26 70,40" fill="#1c1b1a"/>
    <polygon points="130,40 140,26 150,40" fill="#1c1b1a"/>
    <rect x="92" y="72" width="16" height="24" fill="#e3a72e"/>
    <rect x="66" y="66" width="10" height="10" fill="#e3a72e"/>
    <rect x="124" y="66" width="10" height="10" fill="#e3a72e"/>
  `,
  musique: `
    <rect width="200" height="120" fill="#8f330a"/>
    <polygon points="0,0 200,0 200,60 0,120" fill="#c1440e"/>
    <ellipse cx="100" cy="112" rx="90" ry="10" fill="#1c1b1a" opacity="0.35"/>
    <line x1="150" y1="30" x2="150" y2="86" stroke="#ffffff" stroke-width="3"/>
    <circle cx="146" cy="90" r="8" fill="#ffffff"/>
    <text x="36" y="58" font-size="36" fill="#ffffff">♪</text>
    <text x="68" y="84" font-size="28" fill="#f2c869">♫</text>
  `,
  festival: `
    <rect width="200" height="120" fill="#faf0df"/>
    <line x1="0" y1="18" x2="200" y2="18" stroke="#8f330a" stroke-width="2"/>
    <polygon points="10,18 26,18 18,40" fill="#c1440e"/>
    <polygon points="34,18 50,18 42,40" fill="#1f6f78"/>
    <polygon points="58,18 74,18 66,40" fill="#e3a72e"/>
    <polygon points="82,18 98,18 90,40" fill="#c1440e"/>
    <polygon points="106,18 122,18 114,40" fill="#1f6f78"/>
    <polygon points="130,18 146,18 138,40" fill="#e3a72e"/>
    <polygon points="154,18 170,18 162,40" fill="#c1440e"/>
    <polygon points="178,18 194,18 186,40" fill="#1f6f78"/>
    <rect x="70" y="70" width="60" height="42" fill="#1c1b1a"/>
    <polygon points="70,70 100,50 130,70" fill="#1c1b1a"/>
    <circle cx="100" cy="94" r="10" fill="#e3a72e"/>
  `,
  expo: `
    <rect width="200" height="120" fill="#f3ece1"/>
    <rect x="46" y="20" width="108" height="72" fill="#ffffff" stroke="#1c1b1a" stroke-width="4"/>
    <rect x="58" y="32" width="20" height="20" fill="#c1440e"/>
    <rect x="82" y="32" width="20" height="20" fill="#e3a72e"/>
    <rect x="106" y="32" width="20" height="20" fill="#1f6f78"/>
    <rect x="58" y="56" width="20" height="20" fill="#1f6f78"/>
    <rect x="82" y="56" width="20" height="20" fill="#c1440e"/>
    <rect x="106" y="56" width="20" height="20" fill="#e3a72e"/>
    <line x1="70" y1="92" x2="55" y2="112" stroke="#1c1b1a" stroke-width="3"/>
    <line x1="130" y1="92" x2="145" y2="112" stroke="#1c1b1a" stroke-width="3"/>
    <line x1="60" y1="112" x2="140" y2="112" stroke="#1c1b1a" stroke-width="3"/>
  `,
  village: `
    <rect width="200" height="120" fill="#d7e6e2"/>
    <rect y="96" width="200" height="24" fill="#cdbd9d"/>
    <rect x="20" y="66" width="34" height="30" fill="#faf6f1" stroke="#e8e1d8"/>
    <polygon points="16,66 37,48 58,66" fill="#c1440e"/>
    <rect x="80" y="56" width="38" height="40" fill="#f2e7d5" stroke="#e8e1d8"/>
    <polygon points="75,56 99,36 123,56" fill="#8f330a"/>
    <rect x="146" y="70" width="32" height="26" fill="#faf6f1" stroke="#e8e1d8"/>
    <polygon points="142,70 162,52 182,70" fill="#e3a72e"/>
    <ellipse cx="68" cy="70" rx="5" ry="26" fill="#4f6e42"/>
    <rect x="66" y="94" width="4" height="10" fill="#5c4632"/>
    <ellipse cx="134" cy="76" rx="4" ry="20" fill="#6b8f5a"/>
    <rect x="132" y="94" width="4" height="8" fill="#5c4632"/>
  `,
  cinema: `
    <rect width="200" height="120" fill="#181433"/>
    <circle cx="24" cy="18" r="1.6" fill="#ffffff"/>
    <circle cx="50" cy="10" r="1.2" fill="#ffffff"/>
    <circle cx="170" cy="16" r="1.6" fill="#ffffff"/>
    <circle cx="184" cy="34" r="1.2" fill="#ffffff"/>
    <circle cx="100" cy="8" r="1.2" fill="#ffffff"/>
    <rect x="40" y="20" width="120" height="66" rx="4" fill="#faf6f1"/>
    <rect x="46" y="26" width="108" height="54" fill="#e3a72e" opacity="0.25"/>
    <polygon points="90,42 90,64 112,53" fill="#8f330a"/>
    <ellipse cx="20" cy="112" rx="16" ry="8" fill="#232049"/>
    <ellipse cx="180" cy="112" rx="16" ry="8" fill="#232049"/>
  `,
  sport: `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="70" width="200" height="50" fill="#2f8a90"/>
    <circle cx="166" cy="22" r="13" fill="#f2c869"/>
    <polygon points="90,70 90,24 130,70" fill="#ffffff"/>
    <polygon points="90,70 70,70 90,40" fill="#e3a72e"/>
    <rect x="86" y="66" width="10" height="16" fill="#c1440e"/>
    <line x1="30" y1="80" x2="50" y2="80" stroke="#ffffff" stroke-width="3" opacity="0.7"/>
    <line x1="26" y1="90" x2="52" y2="90" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
    <polygon points="164,50 180,54 164,58" fill="#1c1b1a"/>
    <line x1="164" y1="50" x2="164" y2="66" stroke="#1c1b1a" stroke-width="2"/>
  `,
  nature: `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <circle cx="166" cy="24" r="14" fill="#f2c869"/>
    <path d="M0,80 Q40,55 80,78 T200,70 V120 H0 Z" fill="#6b8f5a"/>
    <path d="M0,96 Q50,78 100,96 T200,90 V120 H0 Z" fill="#4f6e42"/>
    <ellipse cx="40" cy="70" rx="4" ry="18" fill="#3d5c33"/>
    <rect x="38" y="86" width="4" height="8" fill="#5c4632"/>
    <path d="M60,120 C70,100 90,100 100,120" fill="none" stroke="#e8cd9a" stroke-width="4"/>
  `,
};

function sceneSVG(key){
  const inner = SCENES[key] || SCENES.village;
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---- illustrations des lieux emblématiques (tags de la fiche ville) ----
const LANDMARK_SCENES = {
  "cours-mirabeau": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <rect y="86" width="200" height="34" fill="#d8cdb8"/>
    <rect x="0" y="80" width="200" height="6" fill="#c8bb9e"/>
    <circle cx="30" cy="46" r="16" fill="#6b8f5a"/><rect x="27" y="60" width="6" height="26" fill="#5c4632"/>
    <circle cx="70" cy="40" r="18" fill="#7fa36b"/><rect x="66" y="56" width="7" height="30" fill="#5c4632"/>
    <circle cx="130" cy="40" r="18" fill="#7fa36b"/><rect x="126" y="56" width="7" height="30" fill="#5c4632"/>
    <circle cx="170" cy="46" r="16" fill="#6b8f5a"/><rect x="167" y="60" width="6" height="26" fill="#5c4632"/>
    <circle cx="100" cy="96" r="14" fill="#bcdce0"/>
    <rect x="94" y="92" width="12" height="14" fill="#8fa9ab"/>
    <circle cx="100" cy="86" r="4" fill="#e3a72e"/>
  `,
  "quartier-mazarin": `
    <rect width="200" height="120" fill="#f3ece1"/>
    <rect y="90" width="200" height="30" fill="#d8cdb8"/>
    <rect x="20" y="36" width="50" height="54" fill="#f2e3c9" stroke="#c8bb9e"/>
    <rect x="80" y="26" width="46" height="64" fill="#e9d3ae" stroke="#c8bb9e"/>
    <rect x="136" y="40" width="44" height="50" fill="#f2e3c9" stroke="#c8bb9e"/>
    <rect x="30" y="50" width="10" height="14" fill="#1f6f78"/><rect x="50" y="50" width="10" height="14" fill="#1f6f78"/>
    <rect x="92" y="42" width="10" height="14" fill="#c1440e"/><rect x="110" y="42" width="10" height="14" fill="#c1440e"/>
    <rect x="148" y="54" width="10" height="14" fill="#1f6f78"/><rect x="164" y="54" width="10" height="14" fill="#1f6f78"/>
    <rect x="95" y="70" width="16" height="20" fill="#8f330a"/>
  `,
  "ville-cezanne": `
    <rect width="200" height="120" fill="#f3ece1"/>
    <polygon points="60,110 100,20 140,110" fill="none" stroke="#5c4632" stroke-width="4"/>
    <rect x="66" y="34" width="68" height="56" fill="#ffffff" stroke="#1c1b1a" stroke-width="3"/>
    <polygon points="66,74 90,50 110,68 134,44 134,90 66,90" fill="#7fa36b"/>
    <polygon points="90,50 100,34 112,50" fill="#8a6a8f"/>
    <circle cx="120" cy="46" r="6" fill="#f2c869"/>
    <line x1="100" y1="110" x2="100" y2="90" stroke="#5c4632" stroke-width="3"/>
  `,
  "ville-universitaire": `
    <rect width="200" height="120" fill="#faf6f1"/>
    <rect x="70" y="70" width="60" height="14" fill="#c1440e"/>
    <rect x="66" y="86" width="68" height="12" fill="#1f6f78"/>
    <rect x="74" y="100" width="52" height="10" fill="#e3a72e"/>
    <polygon points="60,54 140,54 100,34" fill="#1c1b1a"/>
    <rect x="96" y="54" width="8" height="8" fill="#1c1b1a"/>
    <line x1="140" y1="54" x2="150" y2="70" stroke="#1c1b1a" stroke-width="2"/>
    <circle cx="150" cy="72" r="3" fill="#e3a72e"/>
  `,
  "le-port": `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="70" width="200" height="50" fill="#2f8a90"/>
    <circle cx="170" cy="24" r="14" fill="#f2c869"/>
    <polygon points="30,70 30,34 58,70" fill="#ffffff"/>
    <rect x="24" y="62" width="38" height="16" rx="2" fill="#c1440e"/>
    <line x1="30" y1="70" x2="30" y2="30" stroke="#8f330a" stroke-width="2"/>
    <polygon points="90,70 90,42 114,70" fill="#ffffff"/>
    <rect x="84" y="64" width="32" height="14" rx="2" fill="#1f6f78"/>
    <line x1="90" y1="70" x2="90" y2="38" stroke="#17545a" stroke-width="2"/>
    <polygon points="150,70 150,48 170,70" fill="#ffffff"/>
    <rect x="145" y="64" width="26" height="12" rx="2" fill="#e3a72e"/>
    <line x1="150" y1="70" x2="150" y2="44" stroke="#a9791c" stroke-width="2"/>
  `,
  "la-citadelle": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <circle cx="160" cy="22" r="14" fill="#f2c869"/>
    <path d="M0,90 Q60,60 120,86 T200,80 V120 H0 Z" fill="#8a7a5c"/>
    <rect x="80" y="46" width="56" height="46" fill="#c9b58f"/>
    <rect x="70" y="34" width="16" height="58" fill="#c9b58f"/>
    <rect x="130" y="34" width="16" height="58" fill="#c9b58f"/>
    <polygon points="70,34 78,22 86,34" fill="#8a7a5c"/>
    <polygon points="130,34 138,22 146,34" fill="#8a7a5c"/>
    <rect x="76" y="26" width="4" height="8" fill="#8a7a5c"/>
    <rect x="136" y="26" width="4" height="8" fill="#8a7a5c"/>
    <rect x="100" y="66" width="14" height="22" fill="#5c4632"/>
  `,
  "plage-pampelonne": `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <rect y="60" width="200" height="26" fill="#5db3a0"/>
    <rect y="86" width="200" height="34" fill="#e8cd9a"/>
    <circle cx="166" cy="26" r="15" fill="#e3a72e"/>
    <polygon points="30,92 30,64 46,92" fill="#c1440e"/>
    <rect x="24" y="92" width="16" height="6" fill="#8f330a"/>
    <polygon points="76,96 76,68 92,96" fill="#1f6f78"/>
    <rect x="70" y="96" width="16" height="6" fill="#17545a"/>
    <polygon points="122,92 122,64 138,92" fill="#e3a72e"/>
    <rect x="116" y="92" width="16" height="6" fill="#a9791c"/>
    <rect x="26" y="98" width="20" height="6" rx="3" fill="#faf6f1"/>
    <rect x="72" y="102" width="20" height="6" rx="3" fill="#faf6f1"/>
  `,
  "village-pecheurs": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <rect y="80" width="200" height="40" fill="#2f8a90"/>
    <rect x="20" y="46" width="30" height="34" fill="#e3a72e"/>
    <rect x="52" y="40" width="30" height="40" fill="#c1440e"/>
    <rect x="84" y="50" width="30" height="30" fill="#f2e3c9"/>
    <rect x="116" y="42" width="30" height="38" fill="#1f6f78"/>
    <rect x="30" y="58" width="8" height="10" fill="#ffffff"/>
    <rect x="62" y="52" width="8" height="10" fill="#ffffff"/>
    <rect x="94" y="60" width="8" height="10" fill="#ffffff"/>
    <rect x="126" y="54" width="8" height="10" fill="#ffffff"/>
    <polygon points="160,96 160,80 180,96" fill="#ffffff"/>
    <rect x="156" y="90" width="30" height="10" rx="2" fill="#8f330a"/>
  `,
  "cap-camarat": `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="82" width="200" height="38" fill="#2f8a90"/>
    <polygon points="60,82 130,82 150,40 90,20 70,40" fill="#8a7a5c"/>
    <rect x="94" y="16" width="14" height="40" fill="#ffffff" stroke="#c1440e" stroke-width="3"/>
    <polygon points="94,16 101,4 108,16" fill="#c1440e"/>
    <circle cx="101" cy="12" r="3" fill="#f2c869"/>
    <circle cx="170" cy="24" r="12" fill="#f2c869"/>
  `,
  "theatre-verdure": `
    <rect width="200" height="120" fill="#2c2854"/>
    <circle cx="160" cy="20" r="10" fill="#f2c869"/>
    <path d="M20,110 Q100,70 180,110 Z" fill="#3d5c33"/>
    <path d="M32,104 Q100,76 168,104 Z" fill="#4f6e42"/>
    <path d="M44,98 Q100,80 156,98 Z" fill="#6b8f5a"/>
    <rect x="90" y="70" width="20" height="18" fill="#1c1b1a"/>
    <circle cx="100" cy="66" r="10" fill="#e3a72e" opacity="0.6"/>
  `,
  "vignobles-aoc": `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <circle cx="166" cy="24" r="15" fill="#e3a72e"/>
    <path d="M0,60 L200,50 V120 H0 Z" fill="#c9a24a"/>
    <line x1="10" y1="70" x2="60" y2="66" stroke="#6b8f5a" stroke-width="4"/>
    <line x1="10" y1="82" x2="70" y2="78" stroke="#6b8f5a" stroke-width="4"/>
    <line x1="10" y1="94" x2="80" y2="90" stroke="#6b8f5a" stroke-width="4"/>
    <line x1="90" y1="64" x2="150" y2="60" stroke="#6b8f5a" stroke-width="4"/>
    <line x1="100" y1="76" x2="160" y2="72" stroke="#6b8f5a" stroke-width="4"/>
    <line x1="110" y1="88" x2="170" y2="84" stroke="#6b8f5a" stroke-width="4"/>
    <circle cx="40" cy="66" r="3" fill="#5c2a5c"/><circle cx="46" cy="66" r="3" fill="#5c2a5c"/>
    <circle cx="120" cy="60" r="3" fill="#5c2a5c"/><circle cx="126" cy="60" r="3" fill="#5c2a5c"/>
  `,
  "tour-carree": `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="82" width="200" height="38" fill="#2f8a90"/>
    <rect x="80" y="30" width="40" height="60" fill="#e9d3ae" stroke="#8a7a5c" stroke-width="2"/>
    <rect x="76" y="20" width="48" height="12" fill="#8a7a5c"/>
    <rect x="92" y="44" width="10" height="14" fill="#1c1b1a"/>
    <rect x="108" y="44" width="10" height="14" fill="#1c1b1a"/>
    <rect x="92" y="66" width="10" height="14" fill="#1c1b1a"/>
    <rect x="108" y="66" width="10" height="14" fill="#1c1b1a"/>
    <circle cx="160" cy="26" r="12" fill="#f2c869"/>
  `,
  "vieux-village": `
    <rect width="200" height="120" fill="#d7e6e2"/>
    <rect y="96" width="200" height="24" fill="#cdbd9d"/>
    <rect x="20" y="66" width="34" height="30" fill="#faf6f1" stroke="#e8e1d8"/>
    <polygon points="16,66 37,48 58,66" fill="#c1440e"/>
    <rect x="80" y="56" width="38" height="40" fill="#f2e7d5" stroke="#e8e1d8"/>
    <polygon points="75,56 99,36 123,56" fill="#8f330a"/>
    <rect x="146" y="70" width="32" height="26" fill="#faf6f1" stroke="#e8e1d8"/>
    <polygon points="142,70 162,52 182,70" fill="#e3a72e"/>
    <ellipse cx="68" cy="70" rx="5" ry="26" fill="#4f6e42"/>
    <rect x="66" y="94" width="4" height="10" fill="#5c4632"/>
  `,
  "plage-nartelle": `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <rect y="58" width="200" height="30" fill="#5db3a0"/>
    <rect y="88" width="200" height="32" fill="#e8cd9a"/>
    <circle cx="34" cy="28" r="16" fill="#e3a72e"/>
    <polygon points="150,100 150,64 182,100" fill="#1f6f78"/>
    <rect x="148" y="98" width="4" height="20" fill="#17545a"/>
    <rect x="30" y="100" width="20" height="6" rx="3" fill="#faf6f1"/>
    <rect x="70" y="104" width="20" height="6" rx="3" fill="#faf6f1"/>
  `,
  "theatre-mer": `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="70" width="200" height="50" fill="#2f8a90"/>
    <circle cx="160" cy="22" r="13" fill="#f2c869"/>
    <path d="M20,116 Q100,86 180,116 Z" fill="#8a7a5c"/>
    <path d="M32,110 Q100,90 168,110 Z" fill="#a8926e"/>
    <rect x="88" y="80" width="24" height="20" fill="#1c1b1a"/>
    <circle cx="100" cy="76" r="9" fill="#e3a72e" opacity="0.6"/>
  `,
  "plage-gigaro": `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <rect y="66" width="200" height="24" fill="#5db3a0"/>
    <rect y="90" width="200" height="30" fill="#e8cd9a"/>
    <circle cx="166" cy="26" r="15" fill="#e3a72e"/>
    <path d="M0,90 Q30,78 60,90 T120,90 T200,86 V120 H0 Z" fill="#d9bd85"/>
    <ellipse cx="40" cy="82" rx="3" ry="14" fill="#6b8f5a"/>
    <ellipse cx="48" cy="86" rx="3" ry="10" fill="#6b8f5a"/>
    <ellipse cx="60" cy="84" rx="3" ry="12" fill="#6b8f5a"/>
  `,
  "cap-lardier": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <circle cx="160" cy="22" r="13" fill="#f2c869"/>
    <rect y="70" width="200" height="50" fill="#2f8a90"/>
    <path d="M0,70 Q50,40 100,66 T200,55 V70 H0 Z" fill="#6b8f5a"/>
    <path d="M0,80 Q60,55 120,78 T200,68 V80 H0 Z" fill="#4f6e42"/>
    <path d="M40,120 C50,100 70,100 80,120" fill="none" stroke="#e8cd9a" stroke-width="4"/>
  `,
  "croix-constantin": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <circle cx="160" cy="22" r="13" fill="#f2c869"/>
    <path d="M0,90 Q60,66 120,88 T200,80 V120 H0 Z" fill="#8a9a72"/>
    <rect x="96" y="40" width="8" height="46" fill="#c9c2b4"/>
    <rect x="82" y="54" width="36" height="8" fill="#c9c2b4"/>
    <rect x="92" y="86" width="16" height="6" fill="#8a7a5c"/>
  `,
  "plage-debarquement": `
    <rect width="200" height="120" fill="#bfe0e6"/>
    <rect y="72" width="200" height="48" fill="#2f8a90"/>
    <rect y="96" width="200" height="24" fill="#e8cd9a"/>
    <circle cx="160" cy="22" r="13" fill="#f2c869"/>
    <rect x="94" y="76" width="10" height="26" fill="#8a7a5c"/>
    <rect x="82" y="70" width="34" height="8" fill="#c9c2b4"/>
  `,
  "cathedrale-saint-etienne": `
    <rect width="200" height="120" fill="#cfe6ea"/>
    <rect y="100" width="200" height="20" fill="#d8cdb8"/>
    <rect x="66" y="26" width="68" height="74" fill="#e9d3ae" stroke="#8a7a5c" stroke-width="2"/>
    <rect x="52" y="14" width="20" height="88" fill="#dcc7a0" stroke="#8a7a5c" stroke-width="2"/>
    <polygon points="52,14 62,0 72,14" fill="#8a7a5c"/>
    <rect x="128" y="30" width="18" height="72" fill="#dcc7a0" stroke="#8a7a5c" stroke-width="2"/>
    <circle cx="100" cy="48" r="13" fill="#1f6f78"/>
    <circle cx="100" cy="48" r="13" fill="none" stroke="#e3a72e" stroke-width="3"/>
    <polygon points="88,100 100,72 112,100" fill="#5c4632"/>
    <rect x="58" y="40" width="8" height="20" fill="#1c1b1a"/>
    <rect x="134" y="46" width="8" height="18" fill="#1c1b1a"/>
  `,
  "palais-synodal": `
    <rect width="200" height="120" fill="#f3ece1"/>
    <rect y="96" width="200" height="24" fill="#d8cdb8"/>
    <rect x="34" y="42" width="132" height="54" fill="#e9d3ae" stroke="#8a7a5c" stroke-width="2"/>
    <polygon points="26,42 100,14 174,42" fill="#7a6650"/>
    <rect x="48" y="58" width="14" height="30" fill="#1f6f78"/>
    <rect x="76" y="58" width="14" height="30" fill="#1f6f78"/>
    <rect x="110" y="58" width="14" height="30" fill="#1f6f78"/>
    <rect x="138" y="58" width="14" height="30" fill="#1f6f78"/>
    <polygon points="48,58 55,48 62,58" fill="#8a7a5c"/>
    <polygon points="76,58 83,48 90,58" fill="#8a7a5c"/>
    <polygon points="110,58 117,48 124,58" fill="#8a7a5c"/>
    <polygon points="138,58 145,48 152,58" fill="#8a7a5c"/>
    <rect x="92" y="76" width="16" height="20" fill="#5c4632"/>
  `,
  "basilique-saint-savinien": `
    <rect width="200" height="120" fill="#f3ece1"/>
    <rect y="96" width="200" height="24" fill="#d8cdb8"/>
    <rect x="54" y="52" width="92" height="44" fill="#e9d3ae" stroke="#8a7a5c" stroke-width="2"/>
    <rect x="84" y="14" width="24" height="82" fill="#dcc7a0" stroke="#8a7a5c" stroke-width="2"/>
    <polygon points="84,14 96,0 108,14" fill="#8a7a5c"/>
    <circle cx="70" cy="66" r="7" fill="#1f6f78"/>
    <circle cx="130" cy="66" r="7" fill="#1f6f78"/>
    <rect x="92" y="76" width="12" height="20" fill="#5c4632"/>
    <rect x="92" y="34" width="8" height="14" fill="#1c1b1a"/>
  `,
  "vestiges-gallo-romains": `
    <rect width="200" height="120" fill="#fbe9c9"/>
    <circle cx="164" cy="24" r="15" fill="#e3a72e"/>
    <rect y="92" width="200" height="28" fill="#c9b58f"/>
    <rect x="30" y="46" width="14" height="46" fill="#e2d2ae"/>
    <rect x="64" y="40" width="14" height="52" fill="#e2d2ae"/>
    <rect x="98" y="50" width="14" height="42" fill="#d9c69c"/>
    <rect x="132" y="38" width="14" height="54" fill="#e2d2ae"/>
    <path d="M30,46 Q37,34 44,46" fill="none" stroke="#c9b58f" stroke-width="4"/>
    <path d="M64,40 Q71,26 78,40" fill="none" stroke="#c9b58f" stroke-width="4"/>
    <path d="M132,38 Q139,24 146,38" fill="none" stroke="#c9b58f" stroke-width="4"/>
    <ellipse cx="100" cy="100" rx="70" ry="8" fill="#6b8f5a" opacity="0.5"/>
  `,
};

function landmarkSVG(key){
  const inner = LANDMARK_SCENES[key] || SCENES.village;
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// Fiche descriptive de chaque lieu emblématique cité dans les tags des fiches villes.
const LANDMARK_INFO = {
  "Cours Mirabeau": {
    scene: "cours-mirabeau",
    caption: "La grande avenue plantée de platanes centenaires, ponctuée de fontaines, qui traverse le cœur d'Aix-en-Provence.",
  },
  "Quartier Mazarin": {
    scene: "quartier-mazarin",
    caption: "Le quartier historique aux hôtels particuliers du XVIIe siècle, juste au sud du Cours Mirabeau.",
  },
  "Ville de Cézanne": {
    scene: "ville-cezanne",
    caption: "Aix a vu naître et grandir Paul Cézanne, qui a peint la montagne Sainte-Victoire depuis les collines alentour.",
  },
  "Ville universitaire": {
    scene: "ville-universitaire",
    caption: "Près d'un habitant sur quatre est étudiant, avec une université fondée dès 1409.",
  },
  "Le Port": {
    scene: "le-port",
    caption: "Le port historique de Saint-Tropez, environ 800 places de mouillage face aux façades colorées du village.",
  },
  "La Citadelle": {
    scene: "la-citadelle",
    caption: "La forteresse du XVIIe siècle qui domine le village et offre un panorama sur tout le golfe de Saint-Tropez.",
  },
  "Plage de Pampelonne": {
    scene: "plage-pampelonne",
    caption: "Près de 5 km de sable fin entre Saint-Tropez et Ramatuelle, bordés de plages et de restaurants de plage.",
  },
  "Village de pêcheurs": {
    scene: "village-pecheurs",
    caption: "Les ruelles et façades colorées de l'ancien village de pêcheurs, aux origines bien antérieures au tourisme.",
  },
  "Cap Camarat": {
    scene: "cap-camarat",
    caption: "La pointe rocheuse et son phare, au bout du sentier du littoral, avec vue sur toute la presqu'île.",
  },
  "Théâtre de verdure": {
    scene: "theatre-verdure",
    caption: "L'amphithéâtre en plein air niché dans la pinède, scène du Festival de Ramatuelle depuis 1985.",
  },
  "Vignobles AOC": {
    scene: "vignobles-aoc",
    caption: "Les collines viticoles classées en appellation Côtes-de-Provence, qui entourent le village.",
  },
  "Tour Carrée": {
    scene: "tour-carree",
    caption: "La tour de défense du XVIe siècle sur le front de mer de Sainte-Maxime, aujourd'hui transformée en musée.",
  },
  "Vieux village": {
    scene: "vieux-village",
    caption: "Les ruelles et façades du cœur historique, hérité de l'époque où Sainte-Maxime vivait de la pêche.",
  },
  "Plage de la Nartelle": {
    scene: "plage-nartelle",
    caption: "Une des plages labellisées Pavillon bleu de Sainte-Maxime, appréciée pour ses sports nautiques.",
  },
  "Théâtre de la Mer": {
    scene: "theatre-mer",
    caption: "La scène en plein air face au golfe de Saint-Tropez, qui accueille concerts et grands événements l'été.",
  },
  "Plage de Gigaro": {
    scene: "plage-gigaro",
    caption: "Une plage sauvage et préservée de La Croix-Valmer, où vécut le peintre Abel Faivre.",
  },
  "Cap Lardier": {
    scene: "cap-lardier",
    caption: "Un espace naturel protégé à la pointe de la commune, entre pinède odorante et criques sauvages.",
  },
  "Croix de Constantin": {
    scene: "croix-constantin",
    caption: "Une croix de pierre érigée en 1893, sur le lieu où l'empereur Constantin aurait eu sa vision en 312.",
  },
  "Plage du Débarquement": {
    scene: "plage-debarquement",
    caption: "Une plage de La Croix-Valmer où ont débarqué les troupes alliées le 15 août 1944.",
  },
  "Cathédrale Saint-Étienne": {
    scene: "cathedrale-saint-etienne",
    caption: "Commencée en 1135, elle est considérée comme la première cathédrale gothique de France, avec ses deux tours inégales.",
  },
  "Palais Synodal": {
    scene: "palais-synodal",
    caption: "L'ancienne résidence des archevêques de Sens, aujourd'hui l'un des rares palais synodaux médiévaux conservés en France.",
  },
  "Basilique Saint-Savinien": {
    scene: "basilique-saint-savinien",
    caption: "Une des nombreuses églises historiques de Sens, témoin de son riche passé religieux.",
  },
  "Vestiges gallo-romains": {
    scene: "vestiges-gallo-romains",
    caption: "Sens fut la capitale gallo-romaine d'Agedincum : on trouve encore des vestiges de remparts, thermes et amphithéâtre.",
  },
};

function openLandmark(tag){
  const info = LANDMARK_INFO[tag] || { scene: "village", caption: "" };
  const imgWrap = document.getElementById("landmark-modal-img");
  // On essaie d'abord d'afficher une vraie photo (photo-<scene>.jpg, à ajouter par Eric dans le
  // dépôt GitHub). Si le fichier n'existe pas encore, on retombe automatiquement sur l'illustration.
  imgWrap.innerHTML = `<img src="photo-${info.scene}.jpg" alt="${tag}">`;
  imgWrap.querySelector("img").onerror = function(){
    imgWrap.innerHTML = landmarkSVG(info.scene);
  };
  document.getElementById("landmark-modal-title").textContent = tag;
  document.getElementById("landmark-modal-caption").textContent = info.caption;
  document.getElementById("landmark-modal").classList.remove("hidden");
}

function closeLandmark(){
  document.getElementById("landmark-modal").classList.add("hidden");
}

// ---- souvenirs photo par ville (stockage local à l'appareil, via IndexedDB) ----
const PHOTOS_DB_NAME = "wh_photos_db";
const PHOTOS_STORE = "photos";
let photosCurrentCity = null;

function openPhotosDB(){
  return new Promise((resolve, reject) => {
    if (!window.indexedDB){ reject(new Error("IndexedDB indisponible")); return; }
    const req = indexedDB.open(PHOTOS_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTOS_STORE)){
        const store = db.createObjectStore(PHOTOS_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("city", "city", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addPhoto(city, dataUrl){
  const db = await openPhotosDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    tx.objectStore(PHOTOS_STORE).add({ city, dataUrl, ts: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPhotosForCity(city){
  const db = await openPhotosDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const req = tx.objectStore(PHOTOS_STORE).index("city").getAll(city);
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.ts - a.ts));
    req.onerror = () => reject(req.error);
  });
}

async function deletePhotoById(id){
  const db = await openPhotosDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    tx.objectStore(PHOTOS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Redimensionne et compresse une photo côté navigateur avant stockage, pour que le téléphone
// puisse en garder un maximum sans ralentir l'appli.
function resizePhoto(file, maxDim, quality){
  maxDim = maxDim || 1000;
  quality = quality || 0.75;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > maxDim || height > maxDim){
          if (width > height){ height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function openPhotosView(city){
  photosCurrentCity = city;
  document.getElementById("photos-title").textContent = "📸 Mes photos — " + CITIES[city].name;
  showView("photos");
  await renderPhotosGrid(city);
}

async function renderPhotosGrid(city){
  const grid = document.getElementById("photos-grid");
  const empty = document.getElementById("photos-empty");
  let photos = [];
  try { photos = await getPhotosForCity(city); }
  catch(e){ photos = []; }

  if (photos.length === 0){
    grid.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    grid.innerHTML = photos.map(p => `<button type="button" class="photo-thumb" data-id="${p.id}"><img src="${p.dataUrl}" alt=""></button>`).join("");
    grid.querySelectorAll(".photo-thumb").forEach(btn => {
      btn.onclick = () => openLightbox(Number(btn.dataset.id), btn.querySelector("img").src);
    });
  }
}

function openLightbox(id, src){
  document.getElementById("lightbox-img").src = src;
  document.getElementById("photo-lightbox").dataset.photoId = id;
  document.getElementById("photo-lightbox").classList.remove("hidden");
}

function closeLightbox(){
  document.getElementById("photo-lightbox").classList.add("hidden");
}

// Informations pratiques sur les villes pilotes (sources : offices de tourisme, INSEE,
// Wikipédia — chiffres 2022-2023, reformulés).
const CITY_INFO = {
  aix: {
    population: "147 933 habitants (2022)",
    desc: "Fondée en 122 av. J.-C. par le consul romain Sextius sous le nom d'Aquae Sextiae, autour de ses sources thermales. Surnommée « la ville aux cent fontaines », c'est aujourd'hui la ville natale du peintre Paul Cézanne et une grande ville universitaire de Provence.",
    tags: ["Cours Mirabeau", "Quartier Mazarin", "Ville de Cézanne", "Ville universitaire"],
    facts: [
      { ico: "🎓", text: "Ville universitaire depuis 1409 — près d'un habitant sur quatre est étudiant." },
      { ico: "🎭", text: "Festival international d'art lyrique chaque été depuis 1948." },
      { ico: "⛲", text: "Plus de 40 fontaines disséminées dans le centre historique." },
    ],
  },
  st: {
    population: "3 582 habitants (2023)",
    desc: "Ancien village de pêcheurs devenu station internationale à partir de la fin des années 1950, popularisé notamment par le cinéma. Un tout petit village qui accueille pourtant des millions de visiteurs chaque année, entre son port et ses plages.",
    tags: ["Le Port", "La Citadelle", "Plage de Pampelonne", "Village de pêcheurs"],
    facts: [
      { ico: "⛵", text: "Le port historique compte environ 800 places de mouillage." },
      { ico: "🏖️", text: "La plage de Pampelonne s'étend sur près de 5 km au sud du village." },
      { ico: "🚩", text: "Premier port libéré lors du débarquement de Provence, le 15 août 1944." },
    ],
  },
  ram: {
    population: "1 889 habitants (2022)",
    desc: "Village perché à quelques kilomètres de Saint-Tropez, sur la presqu'île éponyme. Son terroir viticole (AOC Côtes-de-Provence) et la plage de Pampelonne, qui s'étend sur son littoral, en font une destination à la fois nature et festive, réputée aussi pour son festival de théâtre en plein air.",
    tags: ["Plage de Pampelonne", "Cap Camarat", "Théâtre de verdure", "Vignobles AOC"],
    facts: [
      { ico: "🏖️", text: "La majeure partie de la plage de Pampelonne se trouve sur la commune de Ramatuelle." },
      { ico: "🎭", text: "Le Festival de Ramatuelle, créé en 1985 par Jean-Claude Brialy, anime le théâtre de verdure chaque été." },
      { ico: "🍷", text: "Un terroir viticole classé en appellation Côtes-de-Provence." },
    ],
  },
  ste: {
    population: "14 118 habitants (2023)",
    desc: "Fondée vers l'an 1000 par les moines de Lérins, la station fait face au golfe de Saint-Tropez au pied du massif des Maures. Longtemps village de pêcheurs avant de se tourner vers le tourisme, elle a conservé son vieux village et sa tour du XVIe siècle tout en développant un long front de mer animé.",
    tags: ["Tour Carrée", "Vieux village", "Plage de la Nartelle", "Théâtre de la Mer"],
    facts: [
      { ico: "🗼", text: "La Tour Carrée, construite au XVIe siècle pour se défendre des attaques, abrite aujourd'hui un musée." },
      { ico: "🏖️", text: "Près de 10 km de littoral accessible, dont plusieurs plages labellisées Pavillon bleu." },
      { ico: "⛳", text: "Une dizaine de golfs à moins de 30 minutes, un secteur particulièrement prisé des golfeurs." },
    ],
  },
  lcv: {
    population: "3 855 habitants (2023)",
    desc: "Commune créée en 1934 entre Saint-Tropez et Cavalaire, à l'histoire liée à une légende : c'est ici que l'empereur Constantin aurait eu sa vision avant la bataille du pont Milvius. Ses plages, dont celle de Gigaro, ont aussi servi de site de débarquement allié en août 1944.",
    tags: ["Plage de Gigaro", "Cap Lardier", "Croix de Constantin", "Plage du Débarquement"],
    facts: [
      { ico: "✝️", text: "Une croix de pierre érigée en 1893 marque le lieu légendaire de la vision de l'empereur Constantin." },
      { ico: "🪖", text: "Ses plages ont servi de point de débarquement allié le 15 août 1944, lors du débarquement de Provence." },
      { ico: "🌿", text: "Le cap Lardier, espace naturel protégé, prolonge la commune jusqu'à la pointe de la presqu'île." },
    ],
  },
  sens: {
    population: "27 275 habitants (2022)",
    desc: "Née de l'ancienne cité gallo-romaine d'Agedincum, capitale du peuple gaulois des Sénons, Sens fut ensuite le siège d'un puissant archevêché ayant eu la primatie sur une grande partie de la France jusqu'au XVIIe siècle. Sa cathédrale, commencée en 1135, est considérée comme la première cathédrale gothique de France.",
    tags: ["Cathédrale Saint-Étienne", "Palais Synodal", "Basilique Saint-Savinien", "Vestiges gallo-romains"],
    facts: [
      { ico: "⛪", text: "La cathédrale Saint-Étienne, commencée en 1135, est considérée comme la première cathédrale gothique de France." },
      { ico: "🏛️", text: "Sens fut la capitale du peuple gaulois des Sénons, à l'origine de la cité gallo-romaine d'Agedincum." },
      { ico: "📜", text: "L'archevêché de Sens a longtemps eu la primatie sur une grande partie de la France, jusqu'au XVIIe siècle." },
    ],
  },
    drag: {
    population: "40 826 habitants (2023)",
    desc: "Sous-préfecture du Var et cœur de la Dracénie, la ville doit une partie de sa notoriété à son passé militaire ainsi qu'à son riche patrimoine culturel, entre musées, chapelle historique et hôtel départemental des expositions.",
    tags: [],
    facts: [
      { ico: "🖼️", text: "Le Musée des Beaux-Arts et le Musée des Arts et Traditions populaires font vivre le patrimoine culturel dracénois." },
      { ico: "🏛️", text: "L'Hôtel départemental des expositions du Var accueille de grandes expositions temporaires." },
      { ico: "🌿", text: "Ville-préfecture entourée de collines, porte d'entrée vers la Provence Verte et les gorges du Verdon." },
    ],
  },
   moug: {
    population: "19 782 habitants (2023)",
    desc: "Village médiéval perché des Alpes-Maritimes, entre Cannes et Grasse. Réputé pour sa gastronomie étoilée et son marché d'art, Mougins fut aussi le dernier lieu de résidence de Pablo Picasso, qui y vécut ses douze dernières années.",
    tags: [],
    facts: [
      { ico: "🎨", text: "Pablo Picasso a vécu ses douze dernières années à Mougins, jusqu'à sa mort en 1973." },
      { ico: "🍽️", text: "Un village réputé pour sa gastronomie, avec plusieurs tables étoilées au guide Michelin." },
      { ico: "🖼️", text: "Le Centre d'art de Mougins accueille des expositions temporaires toute l'année." },
    ],
  },
   mart: {
    population: "49 455 habitants (2023)",
    desc: "Quatrième ville des Bouches-du-Rhône, construite au bord de l'eau entre mer et étang de Berre, ce qui lui vaut le surnom de « Venise Provençale ». Ses canaux, son port et son quartier de l'Île en font une destination prisée sur la Côte Bleue.",
    tags: [],
    facts: [
      { ico: "🚤", text: "Surnommée la « Venise Provençale » pour ses canaux traversant le quartier de l'Île." },
      { ico: "🏰", text: "Le Fort de Bouc, aussi appelé Fort Vauban, garde l'entrée du port depuis des siècles." },
      { ico: "🫒", text: "Un terroir oléicole réputé, avec plusieurs domaines producteurs d'huile d'olive autour de la ville." },
    ],
  },
   paris: {
    population: "2 103 778 habitants (2023)",
    desc: "Capitale de la France et quatrième ville de l'Union européenne, Paris rassemble musées, théâtres, salles de concert et une vie associative foisonnante. Ses événements sont ici récupérés depuis « Que Faire à Paris », l'agenda participatif officiel de la Ville de Paris.",
    tags: [],
    facts: [
      { ico: "🗼", text: "La ville la plus visitée au monde, avec des dizaines de millions de touristes chaque année." },
      { ico: "🎭", text: "Des milliers de lieux culturels : théâtres, salles de concert, musées, bibliothèques..." },
      { ico: "📖", text: "« Que Faire à Paris » est un agenda participatif : habitants et structures culturelles y publient eux-mêmes leurs événements." },
    ],
  },
  nantes: {
    population: "323 204 habitants (2023)",
    desc: "Ancienne capitale des ducs de Bretagne, Nantes est aujourd'hui la sixième ville de France. Ville d'art et d'histoire au bord de la Loire, elle est réputée pour ses Machines de l'île et sa scène culturelle très active.",
    tags: [],
    facts: [
      { ico: "🐘", text: "Les Machines de l'île, dont le célèbre Grand Éléphant, attirent des visiteurs du monde entier." },
      { ico: "🏰", text: "Le Château des ducs de Bretagne, au cœur de la ville, retrace l'histoire du duché." },
      { ico: "🎨", text: "Une scène culturelle et festive très dynamique, entre le Voyage à Nantes et de nombreux festivals." },
    ],
  },
  rennes: {
    population: "224 950 habitants (2023)",
    desc: "Capitale de la Bretagne, Rennes est une grande ville universitaire et étudiante, connue pour son centre historique à colombages et sa vie culturelle foisonnante toute l'année.",
    tags: [],
    facts: [
      { ico: "🎓", text: "Une des villes les plus étudiantes de France, avec plusieurs universités et grandes écoles." },
      { ico: "🏛️", text: "Un centre historique aux maisons à pans de bois, reconstruit après le grand incendie de 1720." },
      { ico: "🎉", text: "Les Tombées de la Nuit, festival des arts de la rue, animent la ville chaque été." },
    ],
  },
   brest: {
    population: "139 456 habitants (2023)",
    desc: "Grande ville portuaire de la pointe bretonne, Brest est tournée vers la mer et abrite l'un des plus grands ports militaires d'Europe. Reconstruite après la Seconde Guerre mondiale, elle est aussi connue pour Océanopolis, son parc de découverte des océans.",
    tags: [],
    facts: [
      { ico: "🌊", text: "Océanopolis, l'un des plus grands aquariums d'Europe, est dédié à la découverte des mondes marins." },
      { ico: "⚓", text: "Un port militaire et de commerce parmi les plus importants d'Europe." },
      { ico: "🎪", text: "Les fêtes maritimes de Brest, organisées tous les 4 ans, rassemblent des milliers de bateaux du monde entier." },
    ],
  },
  bordeaux: {
    population: "260 958 habitants (2023)",
    desc: "Ancienne cité marchande prospère grâce au commerce du vin, Bordeaux a connu une spectaculaire renaissance urbaine depuis les années 2000. Son centre historique, classé à l'UNESCO, est l'un des plus vastes ensembles architecturaux du XVIIIe siècle en Europe.",
    tags: [],
    facts: [
      { ico: "🍷", text: "Capitale mondiale du vin, entourée des vignobles prestigieux du Médoc et de Saint-Émilion." },
      { ico: "🏛️", text: "Le centre historique de Bordeaux est classé au patrimoine mondial de l'UNESCO depuis 2007." },
      { ico: "💧", text: "Le Miroir d'eau, sur les quais, est la plus grande fontaine réfléchissante du monde." },
    ],
  },
  toulouse: {
    population: "504 078 habitants (2023)",
    desc: "Surnommée la « Ville Rose » pour la couleur de ses briques en terre cuite, Toulouse est la capitale historique de l'aéronautique française et une grande ville étudiante du Sud-Ouest.",
    tags: [],
    facts: [
      { ico: "🧱", text: "Surnommée la « Ville Rose » pour la couleur caractéristique de ses briques en terre cuite." },
      { ico: "✈️", text: "Capitale européenne de l'aéronautique et de l'aérospatiale, siège d'Airbus." },
      { ico: "🎓", text: "Une des plus grandes villes étudiantes de France, avec plusieurs universités et grandes écoles." },
    ],
  },
  marseille: {
    population: "873 076 habitants (2023)",
    desc: "Fondée par des marins grecs vers 600 av. J.-C. sous le nom de Massalia, Marseille est la plus ancienne ville de France et la deuxième plus peuplée. Ville portuaire méditerranéenne au caractère affirmé, elle domine la baie depuis la basilique Notre-Dame-de-la-Garde.",
    tags: [],
    facts: [
      { ico: "⛵", text: "Le Vieux-Port, cœur historique de la ville, existe depuis sa fondation il y a environ 2 600 ans." },
      { ico: "🏔️", text: "Les Calanques, entre falaises et eaux turquoise, s'étendent sur des kilomètres au sud de la ville." },
      { ico: "🎨", text: "Capitale européenne de la culture en 2013, avec un musée MuCEM devenu emblématique du renouveau du front de mer." },
    ],
  },
}; 
// ---- traduction anglaise des fiches villes ----
const CITY_INFO_EN = {
  aix: {
    population: "147,933 residents (2022)",
    desc: "Founded in 122 BC by the Roman consul Sextius around its thermal springs, under the name Aquae Sextiae. Nicknamed \"the city of a hundred fountains\", it is today the birthplace of painter Paul Cézanne and a major university town in Provence.",
    facts: [
      { ico: "🎓", text: "A university town since 1409 — about one in four residents is a student." },
      { ico: "🎭", text: "An international opera festival has been held every summer since 1948." },
      { ico: "⛲", text: "More than 40 fountains are scattered throughout the historic centre." },
    ],
  },
  st: {
    population: "3,582 residents (2023)",
    desc: "A former fishing village that became an international resort from the late 1950s onwards, made famous notably by cinema. A tiny village that nonetheless welcomes millions of visitors every year, between its harbour and its beaches.",
    facts: [
      { ico: "⛵", text: "The historic harbour has around 800 mooring berths." },
      { ico: "🏖️", text: "Pampelonne beach stretches nearly 5 km south of the village." },
      { ico: "🚩", text: "The first port liberated during the landing in Provence, on 15 August 1944." },
    ],
  },
  ram: {
    population: "1,889 residents (2022)",
    desc: "A hilltop village a few kilometres from Saint-Tropez, on the peninsula of the same name. Its vineyards (Côtes-de-Provence AOC) and Pampelonne beach, which stretches along its coastline, make it both a nature and party destination, also known for its open-air theatre festival.",
    facts: [
      { ico: "🏖️", text: "Most of Pampelonne beach lies within the town of Ramatuelle." },
      { ico: "🎭", text: "The Ramatuelle Festival, created in 1985 by Jean-Claude Brialy, animates the open-air theatre every summer." },
      { ico: "🍷", text: "A wine-growing area classified under the Côtes-de-Provence appellation." },
    ],
  },
  ste: {
    population: "14,118 residents (2023)",
    desc: "Founded around the year 1000 by the monks of Lérins, the resort faces the Gulf of Saint-Tropez at the foot of the Maures massif. Long a fishing village before turning to tourism, it has kept its old town and 16th-century tower while developing a long, lively seafront.",
    facts: [
      { ico: "🗼", text: "The Tour Carrée, built in the 16th century for defence, now houses a museum." },
      { ico: "🏖️", text: "Nearly 10 km of accessible coastline, including several Blue Flag beaches." },
      { ico: "⛳", text: "About ten golf courses within 30 minutes, a spot particularly popular with golfers." },
    ],
  },
  lcv: {
    population: "3,855 residents (2023)",
    desc: "A town created in 1934 between Saint-Tropez and Cavalaire, linked to a legend: it is said to be where Emperor Constantine had his vision before the Battle of the Milvian Bridge. Its beaches, including Gigaro, also served as an Allied landing site in August 1944.",
    facts: [
      { ico: "✝️", text: "A stone cross erected in 1893 marks the legendary site of Emperor Constantine's vision." },
      { ico: "🪖", text: "Its beaches served as an Allied landing point on 15 August 1944, during the landing in Provence." },
      { ico: "🌿", text: "Cap Lardier, a protected natural area, extends the town to the tip of the peninsula." },
    ],
  },
  sens: {
    population: "27,275 residents (2022)",
    desc: "Born from the ancient Gallo-Roman city of Agedincum, capital of the Gallic Senones people, Sens later became the seat of a powerful archbishopric that held primacy over much of France until the 17th century. Its cathedral, begun in 1135, is considered the first Gothic cathedral in France.",
    facts: [
      { ico: "⛪", text: "Saint-Étienne cathedral, begun in 1135, is considered the first Gothic cathedral in France." },
      { ico: "🏛️", text: "Sens was the capital of the Gallic Senones people, at the origin of the Gallo-Roman city of Agedincum." },
      { ico: "📜", text: "The archbishopric of Sens long held primacy over much of France, until the 17th century." },
    ],
  },
  drag: {
    population: "40,826 residents (2023)",
    desc: "Sub-prefecture of the Var and heart of the Dracénie area, the town owes part of its reputation to its military past as well as to its rich cultural heritage, including museums, a historic chapel and a departmental exhibition hall.",
    facts: [
      { ico: "🖼️", text: "The Fine Arts Museum and the Museum of Arts and Popular Traditions keep the region's cultural heritage alive." },
      { ico: "🏛️", text: "The Var departmental exhibition hall hosts major temporary exhibitions." },
      { ico: "🌿", text: "A prefecture town surrounded by hills, gateway to the Provence Verte area and the Verdon gorges." },
    ],
  },
  moug: {
    population: "19,782 residents (2023)",
    desc: "A hilltop medieval village in the Alpes-Maritimes, between Cannes and Grasse. Known for its Michelin-starred gastronomy and its art market, Mougins was also Pablo Picasso's last home, where he spent the final twelve years of his life.",
    facts: [
      { ico: "🎨", text: "Pablo Picasso spent the last twelve years of his life in Mougins, until his death in 1973." },
      { ico: "🍽️", text: "A village renowned for its gastronomy, with several Michelin-starred restaurants." },
      { ico: "🖼️", text: "The Mougins Art Centre hosts temporary exhibitions all year round." },
    ],
  },
  mart: {
    population: "49,455 residents (2023)",
    desc: "The fourth-largest town in the Bouches-du-Rhône, built on the water between the sea and the Étang de Berre, earning it the nickname \"Provençal Venice\". Its canals, harbour and Île district make it a popular destination on the Côte Bleue.",
    facts: [
      { ico: "🚤", text: "Nicknamed the \"Provençal Venice\" for its canals running through the Île district." },
      { ico: "🏰", text: "Fort de Bouc, also known as Fort Vauban, has guarded the harbour entrance for centuries." },
      { ico: "🫒", text: "A renowned olive-growing area, with several producing estates around the town." },
    ],
  },
  paris: {
    population: "2,103,778 residents (2023)",
    desc: "Capital of France and the fourth-largest city in the European Union, Paris brings together museums, theatres, concert halls and a thriving community life. Its events are gathered here from \"Que Faire à Paris\", the official participatory listings of the City of Paris.",
    facts: [
      { ico: "🗼", text: "The most visited city in the world, with tens of millions of tourists every year." },
      { ico: "🎭", text: "Thousands of cultural venues: theatres, concert halls, museums, libraries..." },
      { ico: "📖", text: "\"Que Faire à Paris\" is a participatory listings platform: residents and cultural venues publish their own events there." },
    ],
  },
  nantes: {
    population: "323,204 residents (2023)",
    desc: "Former capital of the Dukes of Brittany, Nantes is today the sixth-largest city in France. A city of art and history on the banks of the Loire, it is known for Les Machines de l'île and its very active cultural scene.",
    facts: [
      { ico: "🐘", text: "Les Machines de l'île, including the famous Great Elephant, draw visitors from around the world." },
      { ico: "🏰", text: "The Château des ducs de Bretagne, in the heart of the city, retraces the history of the duchy." },
      { ico: "🎨", text: "A very lively cultural and festive scene, between Le Voyage à Nantes and numerous festivals." },
    ],
  },
  rennes: {
    population: "224,950 residents (2023)",
    desc: "Capital of Brittany, Rennes is a major university and student city, known for its half-timbered historic centre and its vibrant cultural life all year round.",
    facts: [
      { ico: "🎓", text: "One of the most student-oriented cities in France, with several universities and top schools." },
      { ico: "🏛️", text: "A historic centre of timber-framed houses, rebuilt after the great fire of 1720." },
      { ico: "🎉", text: "The Tombées de la Nuit festival of street arts brings the city to life every summer." },
    ],
  },
  brest: {
    population: "139,456 residents (2023)",
    desc: "A major port city at the tip of Brittany, Brest faces the sea and is home to one of the largest military ports in Europe. Rebuilt after the Second World War, it is also known for Océanopolis, its ocean discovery park.",
    facts: [
      { ico: "🌊", text: "Océanopolis, one of the largest aquariums in Europe, is dedicated to exploring the marine world." },
      { ico: "⚓", text: "One of the most important military and commercial ports in Europe." },
      { ico: "🎪", text: "The Brest maritime festival, held every 4 years, gathers thousands of boats from around the world." },
    ],
  },
  bordeaux: {
    population: "260,958 residents (2023)",
    desc: "A once-prosperous trading city built on the wine trade, Bordeaux has undergone a spectacular urban renaissance since the 2000s. Its historic centre, a UNESCO World Heritage site, is one of the largest 18th-century architectural ensembles in Europe.",
    facts: [
      { ico: "🍷", text: "The world capital of wine, surrounded by the prestigious vineyards of the Médoc and Saint-Émilion." },
      { ico: "🏛️", text: "Bordeaux's historic centre has been a UNESCO World Heritage site since 2007." },
      { ico: "💧", text: "The Miroir d'eau, on the riverside, is the largest reflecting pool in the world." },
    ],
  },
   toulouse: {
    population: "504,078 residents (2023)",
    desc: "Nicknamed the \"Pink City\" for the colour of its terracotta bricks, Toulouse is the historic capital of French aeronautics and a major student city in the south-west.",
    facts: [
      { ico: "🧱", text: "Nicknamed the \"Pink City\" for the distinctive colour of its terracotta bricks." },
      { ico: "✈️", text: "The European capital of aeronautics and aerospace, home to Airbus." },
      { ico: "🎓", text: "One of the largest student cities in France, with several universities and top schools." },
    ],
  },
  marseille: {
    population: "873,076 residents (2023)",
    desc: "Founded by Greek sailors around 600 BC under the name Massalia, Marseille is the oldest city in France and the second most populous. A Mediterranean port city with a strong character, it overlooks the bay from the Notre-Dame-de-la-Garde basilica.",
    facts: [
      { ico: "⛵", text: "The Old Port, the historic heart of the city, has existed since its founding around 2,600 years ago." },
      { ico: "🏔️", text: "The Calanques, between cliffs and turquoise waters, stretch for kilometres south of the city." },
      { ico: "🎨", text: "European Capital of Culture in 2013, with the MuCEM museum now emblematic of the waterfront's renewal." },
    ],
  },
}; 
// ---- intégration OpenAgenda (Draguignan + Aix-en-Provence) ----
// Draguignan : agenda "Var Tourisme" (agenda officiel utilisé par la Ville de Draguignan).
// Aix-en-Provence : agenda "Aix-Marseille-Provence Métropole", filtré sur la ville d'Aix
// (l'agenda métropole couvre 92 communes, on ne garde que les événements dont l'adresse est
// bien à Aix-en-Provence).
// Les événements sont récupérés en direct depuis le navigateur au chargement de l'appli, puis
// fusionnés avec les événements saisis à la main (SEED_EVENTS).
const OPENAGENDA_KEY = "oa_pk_ZHdDDGNRqTdKzUHsYWAFIigmNoaityfVcVlbNYhWrQxhxPfzpeDDsjVFvWtoDioi";
const OPENAGENDA_SOURCES = [
  { agendaId: 961617,   cityName: "Draguignan",      cityKey: "drag", search: null },
  { agendaId: 21769447, cityName: "Aix-en-Provence",  cityKey: "aix",  search: "Aix-en-Provence" },
  { agendaId: 11035708, cityName: "Mougins",          cityKey: "moug", search: null },
  { agendaId: 65630513, cityName: "Martigues",        cityKey: "mart", search: null },
    { agendaId: 82470621, cityName: "Nantes",           cityKey: "nantes", search: null, size: 2000 },
  { agendaId: 20500020, cityName: "Rennes",           cityKey: "rennes", search: null, size: 2000 },
   { agendaId: 2404802,  cityName: "Brest",            cityKey: "brest", search: null },
  { agendaId: 83392987, cityName: "Bordeaux",         cityKey: "bordeaux", search: null, size: 1500 },
    { agendaId: 42448083, cityName: "Toulouse",         cityKey: "toulouse", search: null, size: 2000 },
          { agendaId: 21769447, cityName: "Marseille",        cityKey: "marseille", search: null, size: 100 },
     { agendaId: 2119473,  cityName: "Marseille",         cityKey: "marseille", search: null },
     { agendaId: 46688663, cityName: "Marseille",         cityKey: "marseille", search: null },                              
];

function sceneForOpenAgendaEvent(title, description){ 
  const text = (title + " " + description).toLowerCase();
  if (/expo|mus[ée]e|galerie/.test(text)) return "expo";
  if (/concert|musique|jazz|chorale/.test(text)) return "musique";
  if (/march[ée]|brocante|vide-grenier/.test(text)) return "marche";
  if (/sport|p[ée]tanque|padel|tournoi|basket/.test(text)) return "sport";
  if (/soir[ée]e|bal|f[êe]te/.test(text)) return "village";
  return "festival";
}

function categoryForOpenAgendaEvent(title, description){
  const text = (title + " " + description).toLowerCase();
  if (/expo|mus[ée]e|galerie/.test(text)) return "Expo";
  if (/concert|musique|jazz|chorale/.test(text)) return "Musique";
  if (/march[ée]|brocante|vide-grenier/.test(text)) return "Marché";
  if (/sport|p[ée]tanque|padel|tournoi|basket/.test(text)) return "Sport";
  if (/soir[ée]e|bal/.test(text)) return "Soirée";
  return "Festival";
}

// Récupère et convertit les événements d'un agenda OpenAgenda pour une ville donnée.
async function fetchOpenAgendaCityEvents(source){
  const size = source.size || 100;
  let url = "https://api.openagenda.com/v2/agendas/" + source.agendaId +
    "/events?key=" + OPENAGENDA_KEY + "&size=" + size;
  if (source.search) url += "&search=" + encodeURIComponent(source.search);
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.events) return [];
    return data.events
      .filter(ev => ev.location && ev.location.city === source.cityName && ev.nextTiming)
      .map(ev => {
               const title = (ev.title && ev.title.fr) || ("Événement à " + source.cityName);
        const description = (ev.description && ev.description.fr) || "";
        let photo = "";
        if (ev.image && ev.image.base) {
          const fullVariant = (ev.image.variants || []).find(v => v.type === "full");
          photo = ev.image.base + (fullVariant ? fullVariant.filename : ev.image.filename);
        }
        const dateIso = ev.nextTiming.begin.slice(0, 10);
        const time = ev.nextTiming.begin.slice(11, 16);
        return {
          id: "oa-" + ev.uid,
          scene: sceneForOpenAgendaEvent(title, description),
          city: source.cityKey,
          category: categoryForOpenAgendaEvent(title, description),
          title,
          date: dateIso,
          time,
          place: (ev.location.name || ev.location.address || source.cityName) + ", " + source.cityName,
          lat: ev.location.latitude,
          lng: ev.location.longitude,
                   price: "Voir sur place",
          thumb: "",
          photo: photo,
          description: description || ("Événement importé depuis OpenAgenda."),
        };
      });
  } catch (err) {
    console.error("Erreur lors de la récupération des événements OpenAgenda (" + source.cityName + ") :", err);
    return [];
  }
}

// Récupère les événements de toutes les sources OpenAgenda configurées, en parallèle.
async function fetchAllOpenAgendaEvents(){
  const results = await Promise.allSettled(OPENAGENDA_SOURCES.map(fetchOpenAgendaCityEvents));
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value)
    .flat();
}

// ---- intégration Paris Data (« Que Faire à Paris », agenda officiel de la Ville de Paris) ----
// Format différent d'OpenAgenda : cette source est gérée séparément avec ses propres champs.
const PARIS_DATA_URL = "https://opendata.paris.fr/api/records/1.0/search/?dataset=que-faire-a-paris-&rows=500";

function sceneForParisEvent(tags){
  const text = tags.toLowerCase();
  if (/photo|histoire|expo/.test(text)) return "expo";
  if (/concert|musique|spectacle musical/.test(text)) return "musique";
  if (/march[ée]|brocante/.test(text)) return "marche";
  if (/sport/.test(text)) return "sport";
  if (/soir[ée]e|bal|f[êe]te/.test(text)) return "village";
  return "festival";
}

function categoryForParisEvent(tags){
  const text = tags.toLowerCase();
  if (/photo|histoire|expo/.test(text)) return "Expo";
  if (/concert|musique|spectacle musical/.test(text)) return "Musique";
  if (/march[ée]|brocante/.test(text)) return "Marché";
  if (/sport/.test(text)) return "Sport";
  if (/soir[ée]e|bal/.test(text)) return "Soirée";
  return "Festival";
}

async function fetchParisEvents(){
  const pageSize = 100;
    const pagesToFetch = 8; // 8 x 100 = jusqu'à 800 événements
  try {
    const requests = [];
    for (let i = 0; i < pagesToFetch; i++){
      const start = i * pageSize;
      const url = "https://opendata.paris.fr/api/records/1.0/search/?dataset=que-faire-a-paris-&rows=" + pageSize + "&start=" + start;
      requests.push(fetch(url).then(res => res.json()));
    }
    const pages = await Promise.all(requests);
    const allRecords = pages.flatMap(p => p.records || []);

    return allRecords
      .filter(r => r.fields && r.fields.lat_lon && r.fields.title)
      .map(r => {
        const f = r.fields;
        const tags = f.qfap_tags || "";
        const occ = (f.occurrences || "").split(";")[0] || "";
        const startPart = occ.split("_")[0];
        const dateIso = startPart ? startPart.slice(0, 10) : (f.date_start || "").slice(0, 10);
        const time = startPart ? startPart.slice(11, 16) : "";
                const placeName = f.address_name || f.contact_organisation_name || "Paris";
        const photo = f.cover_url || (f.image ? f.image : "");
        const zipcode = f.address_zipcode || "";
        const arrondissement = zipcode.length === 5 ? parseInt(zipcode.slice(3), 10) : null;
        return {
          id: "paris-" + (r.recordid || f.event_id),
          scene: sceneForParisEvent(tags),
          city: "paris",
          category: categoryForParisEvent(tags),
          arrondissement: arrondissement,
          title: f.title,
          date: dateIso,
          time: time,
          place: placeName + ", Paris",
          lat: f.lat_lon[0],
          lng: f.lat_lon[1],
                   price: f.price_type ? f.price_type.charAt(0).toUpperCase() + f.price_type.slice(1) : "Voir sur place",
          thumb: "",
          photo: photo,
          description: f.lead_text || "Evenement importe depuis Que Faire a Paris.",
        };
      });
  } catch (err) {
    console.error("Erreur lors de la recuperation des evenements Paris Data :", err);
    return [];
  }
}
// ---- fidélité (points d'utilisation, stockés localement sur cet appareil) ----
// Chaque première ouverture de l'appli dans une nouvelle journée rapporte 5 points. Les paliers
// affichent un statut symbolique ; rien ici n'implique de vraie transaction d'argent.
const LOYALTY_POINTS_PER_VISIT = 5;
const LOYALTY_TIERS = [
  { min: 0,  label: "Découvreur" },
  { min: 20, label: "Habitué" },
  { min: 60, label: "Ambassadeur" },
];

function loadLoyalty(){
  try {
    const saved = JSON.parse(localStorage.getItem("wh_loyalty") || "null");
    if (saved && typeof saved.points === "number") return saved;
  } catch(e){ /* ignore */ }
  return { points: 0, lastVisit: null };
}

function saveLoyalty(){
  localStorage.setItem("wh_loyalty", JSON.stringify(state.loyalty));
}

// Attribue les points de la journée si l'appli n'a pas déjà été ouverte aujourd'hui.
function awardDailyLoyaltyPoints(){
  const today = new Date().toISOString().slice(0, 10);
  if (state.loyalty.lastVisit !== today){
    state.loyalty.points += LOYALTY_POINTS_PER_VISIT;
    state.loyalty.lastVisit = today;
    saveLoyalty();
  }
}

function loyaltyTierLabel(points){
  let label = LOYALTY_TIERS[0].label;
  LOYALTY_TIERS.forEach(t => { if (points >= t.min) label = t.label; });
  return label;
}

function renderLoyalty(){
  const el = document.getElementById("loyalty-badge");
  if (!el) return;
  el.textContent = "⭐ " + state.loyalty.points + " pts · " + loyaltyTierLabel(state.loyalty.points);
}

// ---- confirmation "J'y étais" et parrainage ----
function loadVisitedEvents(){
  try { return new Set(JSON.parse(localStorage.getItem("wh_been_there") || "[]")); }
  catch(e){ return new Set(); }
}
function saveVisitedEvents(){
  localStorage.setItem("wh_been_there", JSON.stringify([...state.visitedEvents]));
}

function markBeenThere(){
  const id = state.currentEventId;
  if (!id || state.visitedEvents.has(id)) return;
  state.visitedEvents.add(id);
  saveVisitedEvents();
  state.loyalty.points += 3;
  saveLoyalty();
  renderLoyalty();
  renderBeenThereButton();
}

function renderBeenThereButton(){
  const btn = document.getElementById("btn-been-there");
  if (!btn) return;
  const done = state.visitedEvents.has(state.currentEventId);
  btn.disabled = done;
  const key = done ? "✅ Confirmé — merci !" : "✅ J'y étais (+3 pts)";
  const dict = TRANSLATIONS[currentLang.value] || {};
  btn.textContent = currentLang.value === "en" && dict[key] ? dict[key] : key;
}
// Bonus de bienvenue pour un ami arrivé via un lien de parrainage (?ref=1 dans l'URL).
function awardReferralWelcomeBonus(){
  const params = new URLSearchParams(window.location.search);
  if (params.get("ref") !== "1") return;
  if (localStorage.getItem("wh_referral_bonus_claimed")) return;
  state.loyalty.points += 10;
  saveLoyalty();
  localStorage.setItem("wh_referral_bonus_claimed", "1");
}

// Copie le lien de parrainage dans le presse-papiers (ou propose le partage natif si disponible).
async function inviteFriend(){
  const url = window.location.origin + window.location.pathname + "?ref=1";
  if (navigator.share) {
    try { await navigator.share({ title: "What's happen", text: "Découvre les événements près de chez toi !", url }); return; }
    catch(e){ /* l'utilisateur a annulé, on retombe sur la copie */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("Lien copié ! Envoie-le à un ami — il recevra 10 points de bienvenue en l'ouvrant.");
  } catch(e){
    prompt("Copie ce lien et envoie-le à un ami :", url);
  }
}

// ---- state ----

// ---- state ----
// ---- state ----
const state = {
  city: "aix",
  mode: "carte",
  selectedCategories: new Set(),
  selectedArrondissement: null,
  selectedPeriod: null,
  radiusKm: 20,
  userPos: null, // {lat, lng}
  currentEventId: null,
  favorites: loadFavorites(),
  localEvents: loadLocalEvents(),
 openAgendaEvents: [],
  loyalty: loadLoyalty(),
  visitedEvents: loadVisitedEvents(),
}; 

function allEvents(){
  return [...SEED_EVENTS, ...state.localEvents, ...state.openAgendaEvents];
}

// ---- geo helpers ----
function haversineKm(lat1, lng1, lat2, lng2){
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function referencePoint(){
  if (state.userPos) return state.userPos;
  return CITIES[state.city];
}

function distanceToEvent(ev){
  const ref = referencePoint();
  return haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
}

// ---- local persistence (this browser only, no server yet) ----
function loadFavorites(){
  try { return new Set(JSON.parse(localStorage.getItem("wh_favorites") || "[]")); }
  catch(e){ return new Set(); }
}
function saveFavorites(){
  localStorage.setItem("wh_favorites", JSON.stringify([...state.favorites]));
}
function loadLocalEvents(){
  try { return JSON.parse(localStorage.getItem("wh_local_events") || "[]"); }
  catch(e){ return []; }
}
function saveLocalEvents(){
  localStorage.setItem("wh_local_events", JSON.stringify(state.localEvents));
}

// ---- filtering ----
function matchesPeriod(ev, period){
  if (!period) return true;
  const todayIso = new Date().toISOString().slice(0, 10);
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const weekLimit = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  if (period === "today") return ev.date === todayIso;
  if (period === "tomorrow") return ev.date === tomorrowIso;
  if (period === "week") return ev.date >= todayIso && ev.date <= weekLimit;
  return true;
}

function baseVisibleEvents(){
  const ref = referencePoint();
  return allEvents()
    .map(ev => ({ ...ev, distance: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) }))
    .filter(ev => state.userPos ? ev.distance <= state.radiusKm : ev.city === state.city)
    .filter(ev => state.selectedCategories.size === 0 || state.selectedCategories.has(ev.category))
    .filter(ev => !state.selectedArrondissement || ev.arrondissement === state.selectedArrondissement);
}

function visibleEvents(){
  return baseVisibleEvents()
    .filter(ev => matchesPeriod(ev, state.selectedPeriod))
    .sort((a, b) => a.distance - b.distance);
}
// Affiche le rayon en mètres si < 1 km, sinon en km.
function formatRadius(km){
  if (km < 1) return Math.round(km * 1000) + " m";
  return (Math.round(km * 10) / 10) + " km";
}
function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ---- rendering ----
function renderCategoryChips(){
  const el = document.getElementById("category-chips");
  el.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const b = document.createElement("button");
    b.className = "chip-btn" + (state.selectedCategories.has(cat) ? " active" : "");
    b.textContent = cat;
    b.onclick = () => {
      if (state.selectedCategories.has(cat)) state.selectedCategories.delete(cat);
      else state.selectedCategories.add(cat);
      renderCategoryChips();
      renderDiscover();
    };
    el.appendChild(b);
  });
}

const CITY_PHOTOS = {
  aix: "photo-cours-mirabeau.jpg",
  st: "photo-le-port.jpg",
  ram: "photo-plage-pampelonne.jpg",
  ste: "photo-tour-carree.jpg",
  lcv: "photo-plage-gigaro.jpg",
  drag: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Draguignan-tour-horloge-hiver.jpg/960px-Draguignan-tour-horloge-hiver.jpg",
  moug: "https://commons.wikimedia.org/wiki/Special:FilePath/Mougins_01_(cropped).jpg",
  mart: "https://commons.wikimedia.org/wiki/Special:FilePath/Martigues_-_Miroir_aux_Oiseaux.jpg",
    paris: "https://commons.wikimedia.org/wiki/Special:FilePath/Eiffel_Tower_in_2022_02.jpg",  
  rennes: "https://commons.wikimedia.org/wiki/Special:FilePath/Vue_sud-ouest_de_la_place_du_parlement_de_Bretagne,_Rennes,_France.jpg",
  bordeaux: "https://commons.wikimedia.org/wiki/Special:FilePath/138_-_Place_de_la_Bourse_et_le_miroir_d'eau_-_Bordeaux.jpg",
  toulouse: "https://commons.wikimedia.org/wiki/Special:FilePath/Toulouse_Capitole_Night_Wikimedia_Commons.jpg",
    marseille: "https://commons.wikimedia.org/wiki/Special:FilePath/Notre-Dame_de_la_Garde_aerial_view_2020_(cropped).jpeg",
    sens: "https://commons.wikimedia.org/wiki/Special:FilePath/Cath%C3%A9drale_Saint-%C3%89tienne,_Sens-6998.jpg",
  brest: "https://commons.wikimedia.org/wiki/Special:FilePath/Chateau_de_Brest_et_Tour_Tanguy.jpg",
};
function renderLocateBar(){
  document.getElementById("locate-label").textContent = state.userPos ? "Position détectée" : "Ville sélectionnée";
  document.getElementById("locate-value").textContent = state.userPos
    ? "📍 Votre position actuelle"
    : "📍 " + CITIES[state.city].name;
  document.querySelectorAll(".chip-btn[data-city]").forEach(b => {
    b.classList.toggle("active", !state.userPos && b.dataset.city === state.city);
  });

  const photoEl = document.getElementById("locate-bar-photo");
  const photoUrl = !state.userPos && CITY_PHOTOS[state.city];
  if (photoUrl) {
    photoEl.style.backgroundImage = `url('${photoUrl}')`;
    photoEl.classList.add("visible");
  } else {
    photoEl.classList.remove("visible");
  }
}

function renderCityInfo(){
  const el = document.getElementById("city-info");
  if (state.userPos){
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  const baseInfo = CITY_INFO[state.city];
  const enInfo = CITY_INFO_EN[state.city];
  const info = (currentLang.value === "en" && enInfo)
    ? { ...baseInfo, population: enInfo.population, desc: enInfo.desc, facts: enInfo.facts }
    : baseInfo;
  const name = CITIES[state.city].name;
  el.innerHTML = `
    <div class="ci-head">
      <span class="ci-name">${name}</span>
      <span class="ci-pop">👥 ${info.population}</span>
    </div>
    <p class="ci-desc">${info.desc}</p>
    <div class="ci-tags">${info.tags.map(t => `<button type="button" class="ci-tag" data-tag="${t}"><span class="ci-tag-ico">📷</span>${t}</button>`).join("")}</div>
    <div class="ci-facts">
      ${info.facts.map(f => `<div class="ci-fact"><span class="ico">${f.ico}</span><span>${f.text}</span></div>`).join("")}
    </div>
    <div class="ci-source">Sources : offices de tourisme, INSEE, Wikipédia.</div>
    <button type="button" class="btn-photos" id="btn-city-photos">📸 Mes photos de ${name}</button>
  `;
  el.querySelectorAll(".ci-tag").forEach(btn => {
    btn.onclick = () => openLandmark(btn.dataset.tag);
  });
  el.querySelector("#btn-city-photos").onclick = () => openPhotosView(state.city);
}

function renderMap(events){
  const pinsEl = document.getElementById("map-pins");
  pinsEl.innerHTML = "";
  const ref = referencePoint();
  const spanKm = Math.max(state.radiusKm, 3) * 1.3;

  events.slice(0, 8).forEach(ev => {
    const dxKm = (ev.lng - ref.lng) * 111 * Math.cos(ref.lat * Math.PI / 180);
    const dyKm = (ev.lat - ref.lat) * 111;
    const leftPct = 50 + (dxKm / spanKm) * 50;
    const topPct = 50 - (dyKm / spanKm) * 50;
    if (leftPct < 4 || leftPct > 96 || topPct < 4 || topPct > 96) return;
       const pin = document.createElement("div");
    pin.className = "map-pin";
    pin.dataset.cat = ev.category;
    pin.style.left = leftPct + "%";
    pin.style.top = topPct + "%";
    pin.title = ev.title;
    pin.onclick = () => openDetail(ev.id);
    pinsEl.appendChild(pin);
  });

  document.getElementById("map-radius-label").textContent = state.userPos ? state.radiusKm : "";
  document.getElementById("map-radius-tag").classList.toggle("hidden", !state.userPos);
}

function eventCardHTML(ev){
  const distTxt = ev.distance != null ? ev.distance.toFixed(1).replace(".", ",") + " km" : "";
  return `
    <button class="event-card" data-id="${ev.id}" data-cat="${ev.category}">
      <div class="thumb">${sceneSVG(ev.scene)}</div>
      <div class="info">
        <div class="cat">${ev.category}</div>
        <div class="title">${ev.title}</div>
        <div class="meta">${formatDate(ev.date)} · ${ev.time}</div>
      </div>
      <div class="dist">${distTxt}</div>
    </button>`;
}

function renderArrondissementFilter(){
  const row = document.getElementById("arrondissement-row");
  const select = document.getElementById("arrondissement-select");
  if (!row || !select) return;

  const isParis = !state.userPos && state.city === "paris";
  row.classList.toggle("hidden", !isParis);
  if (!isParis) return;

  const present = new Set(
    allEvents().filter(ev => ev.city === "paris" && ev.arrondissement).map(ev => ev.arrondissement)
  );
  const sorted = [...present].sort((a, b) => a - b);
  const current = select.value;
  select.innerHTML = '<option value="">Tous</option>' +
    sorted.map(n => `<option value="${n}">${n}ᵉ arrondissement</option>`).join("");
  select.value = sorted.includes(Number(current)) ? current : "";
}

function updateStatsBanner(events){
  const todayIso = new Date().toISOString().slice(0, 10);
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const weekLimit = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const todayCount = events.filter(ev => ev.date === todayIso).length;
  const tomorrowCount = events.filter(ev => ev.date === tomorrowIso).length;
  const weekCount = events.filter(ev => ev.date >= todayIso && ev.date <= weekLimit).length;

  const elToday = document.getElementById("stat-today");
  const elTomorrow = document.getElementById("stat-tomorrow");
  const elWeek = document.getElementById("stat-week");
  if (elToday) elToday.textContent = todayCount;
  if (elTomorrow) elTomorrow.textContent = tomorrowCount;
  if (elWeek) elWeek.textContent = weekCount;
}

function renderDiscover(){
  const events = visibleEvents();
  const listEl = document.getElementById("event-list");
  const emptyEl = document.getElementById("empty-state");
  updateStatsBanner(baseVisibleEvents());
  if (events.length === 0){
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    listEl.innerHTML = events.map(eventCardHTML).join("");
    listEl.querySelectorAll(".event-card").forEach(card => {
      card.onclick = () => openDetail(card.dataset.id);
    });
  }

  renderMap(events);
  renderLocateBar();
  renderCityInfo();
  renderArrondissementFilter();
}

function renderFavorites(){
  const events = allEvents()
    .filter(ev => state.favorites.has(ev.id))
    .map(ev => ({ ...ev, distance: distanceToEvent(ev) }));
  const listEl = document.getElementById("favorites-list");
  const emptyEl = document.getElementById("favorites-empty");
  if (events.length === 0){
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    listEl.innerHTML = events.map(eventCardHTML).join("");
    listEl.querySelectorAll(".event-card").forEach(card => {
      card.onclick = () => openDetail(card.dataset.id);
    });
  }
}

// ---- detail view ----
function openDetail(id){
  const ev = allEvents().find(e => e.id === id);
  if (!ev) return;
  state.currentEventId = id;

    const heroEl = document.getElementById("detail-hero");
  heroEl.className = "detail-hero";
  if (ev.photo) {
    heroEl.innerHTML = `<img src="${ev.photo}" alt="${ev.title}" onerror="this.parentElement.innerHTML = ${JSON.stringify(sceneSVG(ev.scene))};">`;
  } else {
    heroEl.innerHTML = sceneSVG(ev.scene);
  }
  document.getElementById("detail-cat").textContent = iconFor(ev.category) + " " + ev.category;
  document.getElementById("detail-title").textContent = ev.title;
  document.getElementById("detail-date").textContent = formatDate(ev.date);
  document.getElementById("detail-time").textContent = ev.time;
  document.getElementById("detail-place").textContent = ev.place;
  document.getElementById("detail-distance").textContent = "à " + distanceToEvent(ev).toFixed(1).replace(".", ",") + " km de la référence choisie";
  document.getElementById("detail-price").textContent = ev.price;
  document.getElementById("detail-desc").textContent = ev.description;

   const favBtn = document.getElementById("btn-favorite");
  favBtn.classList.toggle("active", state.favorites.has(id));
  favBtn.textContent = state.favorites.has(id) ? "❤️" : "🤍";
  renderBeenThereButton();

  showView("detail");
}

function iconFor(cat){
  return { Musique:"🎷", Marché:"🛍️", Festival:"🎪", Sport:"🏁", Soirée:"🎧", Expo:"🖼️" }[cat] || "📌";
}

// ---- view switching ----
function showView(name){
  ["discover","detail","publish","confirm","favorites","photos"].forEach(v => {
    document.getElementById("view-" + v).classList.toggle("hidden", v !== name);
  });
  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  window.scrollTo(0, 0);
  if (name === "favorites") renderFavorites();
}

// ---- wiring ----
document.addEventListener("DOMContentLoaded", () => {
  renderCategoryChips();
  renderDiscover();
  applyTranslation();

     const langBtn = document.getElementById("btn-lang-toggle");
  if (langBtn) langBtn.onclick = toggleLang;

  document.querySelectorAll(".stat[data-filter]").forEach(btn => {
    btn.onclick = () => {
      const filter = btn.dataset.filter;
      if (state.selectedPeriod === filter) {
        state.selectedPeriod = null;
      } else {
        state.selectedPeriod = filter;
      }
      document.querySelectorAll(".stat[data-filter]").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === state.selectedPeriod);
      });
      renderDiscover();
    };
  }); 

  document.querySelectorAll(".region-toggle").forEach(btn => {
    btn.onclick = () => btn.closest(".region-block").classList.toggle("open");
  });

  auth.onAuthStateChanged(user => renderAccountState(user));

  const accountModal = document.getElementById("account-modal");
  document.getElementById("btn-account").onclick = () => accountModal.classList.remove("hidden");
  document.getElementById("btn-account-close").onclick = () => accountModal.classList.add("hidden");
  accountModal.onclick = (e) => {
    if (e.target.id === "account-modal") accountModal.classList.add("hidden");
  };

  document.getElementById("btn-account-login").onclick = () => {
    hideAccountError();
    const email = document.getElementById("account-email").value;
    const password = document.getElementById("account-password").value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => accountModal.classList.add("hidden"))
      .catch(err => showAccountError(err.message));
  };

  document.getElementById("btn-account-signup").onclick = () => {
    hideAccountError();
    const email = document.getElementById("account-email").value;
    const password = document.getElementById("account-password").value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => accountModal.classList.add("hidden"))
      .catch(err => showAccountError(err.message));
  };

  document.getElementById("btn-account-logout").onclick = () => {
    auth.signOut();
  };

   // Points de fidélité : on attribue les points du jour (si pas déjà fait) et on affiche le badge.
  awardDailyLoyaltyPoints();
  awardReferralWelcomeBonus();
  renderLoyalty();

   const beenThereBtn = document.getElementById("btn-been-there");
  if (beenThereBtn) beenThereBtn.onclick = markBeenThere;

    const inviteBtn = document.getElementById("btn-invite-friend");
  if (inviteBtn) inviteBtn.onclick = inviteFriend;

  const newsletterBtn = document.getElementById("btn-newsletter");
  const newsletterModal = document.getElementById("newsletter-modal");
  const newsletterCloseBtn = document.getElementById("btn-newsletter-close");
  if (newsletterBtn && newsletterModal) {
    newsletterBtn.onclick = () => newsletterModal.classList.remove("hidden");
    newsletterCloseBtn.onclick = () => newsletterModal.classList.add("hidden");
    newsletterModal.onclick = (e) => {
      if (e.target.id === "newsletter-modal") newsletterModal.classList.add("hidden");
    };
  }

   // Récupération des événements OpenAgenda + Paris Data en arrière-plan, sans bloquer l'affichage
  // initial : dès qu'ils arrivent, on les fusionne et on rafraîchit l'écran.
  Promise.all([fetchAllOpenAgendaEvents(), fetchParisEvents()]).then(([oaEvents, parisEvents]) => {
    state.openAgendaEvents = [...oaEvents, ...parisEvents];
    renderDiscover();
  });

  document.querySelectorAll(".chip-btn[data-city]").forEach(b => {
    b.onclick = () => {
      state.city = b.dataset.city;
      state.userPos = null;
      renderDiscover();
    };
  });

  document.getElementById("btn-geoloc").onclick = () => {
    if (!navigator.geolocation){
      alert("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    const btn = document.getElementById("btn-geoloc");
    btn.textContent = "📍 Localisation…";
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        btn.textContent = "📍 Ma position";
        renderDiscover();
      },
      err => {
        btn.textContent = "📍 Ma position";
        alert("Position indisponible (" + err.message + "). Vous pouvez choisir une ville manuellement.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  document.getElementById("btn-see-list").onclick = () => {
    document.querySelectorAll(".seg").forEach(x => x.classList.remove("active"));
    document.querySelector('.seg[data-mode="liste"]').classList.add("active");
    state.mode = "liste";
    document.getElementById("map-mock").classList.add("hidden");
    document.getElementById("event-list").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  document.querySelectorAll(".seg").forEach(b => {
    b.onclick = () => {
      document.querySelectorAll(".seg").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.mode = b.dataset.mode;
      document.getElementById("map-mock").classList.toggle("hidden", state.mode !== "carte");
    };
  });

   document.getElementById("btn-filters").onclick = () => {
    document.getElementById("filters-panel").classList.toggle("hidden");
  };
  const arrSelect = document.getElementById("arrondissement-select");
  if (arrSelect) {
    arrSelect.onchange = (e) => {
      state.selectedArrondissement = e.target.value ? Number(e.target.value) : null;
      renderDiscover();
    };
  }
    document.getElementById("radius-range").oninput = (e) => {
    state.radiusKm = Number(e.target.value);
    document.getElementById("radius-value").textContent = formatRadius(state.radiusKm);
    renderDiscover();
  };

  document.querySelectorAll("#radius-presets .chip-btn").forEach(b => {
    b.onclick = () => {
      state.radiusKm = Number(b.dataset.radius);
      document.getElementById("radius-range").value = state.radiusKm;
      document.getElementById("radius-value").textContent = formatRadius(state.radiusKm);
      document.querySelectorAll("#radius-presets .chip-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderDiscover();
    };
  });

  document.getElementById("btn-back-detail").onclick = () => showView("discover");
 document.getElementById("btn-interested").onclick = (e) => {
    const isInterested = e.target.classList.toggle("active");
    const dict = TRANSLATIONS[currentLang.value] || {};
    const key = isInterested ? "✓ Vous êtes intéressé(e)" : "Je suis intéressé(e)";
    e.target.textContent = currentLang.value === "en" && dict[key] ? dict[key] : key;
  };
  document.getElementById("btn-favorite").onclick = () => {
    const id = state.currentEventId;
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavorites();
    openDetail(id);
  };

  document.getElementById("btn-publish-header").onclick = () => showView("publish");
  document.querySelectorAll(".nav-item").forEach(b => {
    b.onclick = () => showView(b.dataset.view);
  });
  document.getElementById("btn-back-publish").onclick = () => showView("discover");
  document.getElementById("btn-confirm-back").onclick = () => showView("discover");

  document.getElementById("btn-landmark-close").onclick = closeLandmark;
  document.getElementById("landmark-modal").onclick = (e) => {
    if (e.target.id === "landmark-modal") closeLandmark();
  };

  document.getElementById("btn-back-photos").onclick = () => showView("discover");
  document.getElementById("btn-add-photo").onclick = () => document.getElementById("photo-input").click();
  document.getElementById("photo-input").onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files){
      try {
        const dataUrl = await resizePhoto(file);
        await addPhoto(photosCurrentCity, dataUrl);
      } catch(err){
        console.error("Erreur lors de l'ajout de la photo :", err);
      }
    }
    e.target.value = "";
    await renderPhotosGrid(photosCurrentCity);
  };
  document.getElementById("btn-lightbox-close").onclick = closeLightbox;
  document.getElementById("photo-lightbox").onclick = (e) => {
    if (e.target.id === "photo-lightbox") closeLightbox();
  };
  document.getElementById("btn-lightbox-delete").onclick = async () => {
    const id = Number(document.getElementById("photo-lightbox").dataset.photoId);
    await deletePhotoById(id);
    closeLightbox();
    await renderPhotosGrid(photosCurrentCity);
  };

  document.getElementById("publish-form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const city = fd.get("city");
    const newEvent = {
      id: "local-" + Date.now(),
      city,
      category: fd.get("category"),
      scene: CATEGORY_SCENE[fd.get("category")] || "village",
      title: fd.get("title"),
      date: fd.get("date"),
      time: fd.get("time"),
      place: fd.get("place"),
      lat: CITIES[city].lat + (Math.random() - 0.5) * 0.01,
      lng: CITIES[city].lng + (Math.random() - 0.5) * 0.01,
      price: "Non précisé",
      thumb: "alt",
      description: fd.get("description") || "Événement publié par un utilisateur.",
    };
    state.localEvents.push(newEvent);
    saveLocalEvents();
    state.loyalty.points += 20;
    saveLoyalty();
    renderLoyalty();
    e.target.reset();
    showView("confirm");
  };
});
