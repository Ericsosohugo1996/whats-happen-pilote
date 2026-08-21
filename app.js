// What's happen — pilote web (Phase 1)
// Aucune dépendance externe : tout est en JavaScript natif.

const CITIES = {
  aix: { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  st:  { name: "Saint-Tropez",    lat: 43.2677, lng: 6.6407 },
  ram: { name: "Ramatuelle",      lat: 43.2135, lng: 6.6155 },
};

// Événements réels d'août-septembre 2026, reformulés à partir des agendas officiels (offices de
// tourisme d'Aix-en-Provence, de Saint-Tropez et de Ramatuelle) — dates et lieux vérifiés le 21/08/2026.
// Quelques événements génériques (marchés) complètent la liste pour la démonstration.
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

// Informations pratiques sur les trois villes pilotes (sources : offices de tourisme, INSEE,
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
};

// ---- state ----
const state = {
  city: "aix",
  mode: "carte",
  selectedCategories: new Set(),
  radiusKm: 15,
  userPos: null, // {lat, lng}
  currentEventId: null,
  favorites: loadFavorites(),
  localEvents: loadLocalEvents(),
};

function allEvents(){
  return [...SEED_EVENTS, ...state.localEvents];
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
function visibleEvents(){
  const ref = referencePoint();
  return allEvents()
    .map(ev => ({ ...ev, distance: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) }))
    .filter(ev => state.userPos ? ev.distance <= state.radiusKm : ev.city === state.city)
    .filter(ev => state.selectedCategories.size === 0 || state.selectedCategories.has(ev.category))
    .sort((a, b) => a.distance - b.distance);
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

function renderLocateBar(){
  document.getElementById("locate-label").textContent = state.userPos ? "Position détectée" : "Ville sélectionnée";
  document.getElementById("locate-value").textContent = state.userPos
    ? "📍 Votre position actuelle"
    : "📍 " + CITIES[state.city].name;

  document.querySelectorAll(".chip-btn[data-city]").forEach(b => {
    b.classList.toggle("active", !state.userPos && b.dataset.city === state.city);
  });
}

function renderCityInfo(){
  const el = document.getElementById("city-info");
  if (state.userPos){
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  const info = CITY_INFO[state.city];
  const name = CITIES[state.city].name;
  el.innerHTML = `
    <div class="ci-head">
      <span class="ci-name">${name}</span>
      <span class="ci-pop">👥 ${info.population}</span>
    </div>
    <p class="ci-desc">${info.desc}</p>
    <div class="ci-tags">${info.tags.map(t => `<span class="ci-tag">${t}</span>`).join("")}</div>
    <div class="ci-facts">
      ${info.facts.map(f => `<div class="ci-fact"><span class="ico">${f.ico}</span><span>${f.text}</span></div>`).join("")}
    </div>
    <div class="ci-source">Sources : offices de tourisme, INSEE, Wikipédia.</div>
  `;
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
    pin.style.left = leftPct + "%";
    pin.style.top = topPct + "%";
    pin.title = ev.title;
    pin.onclick = () => openDetail(ev.id);
    pinsEl.appendChild(pin);
  });

  document.getElementById("map-radius-label").textContent = state.userPos ? state.radiusKm : "—";
}

function eventCardHTML(ev){
  const distTxt = ev.distance != null ? ev.distance.toFixed(1).replace(".", ",") + " km" : "";
  return `
    <button class="event-card" data-id="${ev.id}">
      <div class="thumb">${sceneSVG(ev.scene)}</div>
      <div class="info">
        <div class="cat">${ev.category}</div>
        <div class="title">${ev.title}</div>
        <div class="meta">${formatDate(ev.date)} · ${ev.time}</div>
      </div>
      <div class="dist">${distTxt}</div>
    </button>`;
}

function renderDiscover(){
  const events = visibleEvents();
  const listEl = document.getElementById("event-list");
  const emptyEl = document.getElementById("empty-state");

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

  document.getElementById("detail-hero").className = "detail-hero";
  document.getElementById("detail-hero").innerHTML = sceneSVG(ev.scene);
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

  showView("detail");
}

function iconFor(cat){
  return { Musique:"🎷", Marché:"🛍️", Festival:"🎪", Sport:"🏁", Soirée:"🎧", Expo:"🖼️" }[cat] || "📌";
}

// ---- view switching ----
function showView(name){
  ["discover","detail","publish","confirm","favorites"].forEach(v => {
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
  document.getElementById("radius-range").oninput = (e) => {
    state.radiusKm = Number(e.target.value);
    document.getElementById("radius-value").textContent = state.radiusKm;
    renderDiscover();
  };

  document.getElementById("btn-back-detail").onclick = () => showView("discover");
  document.getElementById("btn-interested").onclick = (e) => {
    e.target.textContent = e.target.textContent.startsWith("Je suis") ? "✓ Vous êtes intéressé(e)" : "Je suis intéressé(e)";
    e.target.classList.toggle("active");
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
    e.target.reset();
    showView("confirm");
  };
});
