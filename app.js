// What's happen — pilote web (Phase 1)
// Aucune dépendance externe : tout est en JavaScript natif.

const CITIES = {
  aix: { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  st:  { name: "Saint-Tropez",    lat: 43.2677, lng: 6.6407 },
  ram: { name: "Ramatuelle",      lat: 43.2135, lng: 6.6155 },
};

// Événements réels d'août 2026, reformulés à partir des agendas officiels (offices de tourisme
// d'Aix-en-Provence, de Saint-Tropez et de Ramatuelle) — dates et lieux vérifiés le 21/08/2026.
// Quelques événements génériques (marchés) complètent la liste pour la démonstration.
const SEED_EVENTS = [
  {
    id: "aix-liberation",
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
    id: "st-moutte",
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
    id: "ram-festival",
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
];

const CATEGORIES = ["Musique", "Marché", "Festival", "Sport", "Soirée", "Expo"];

// Informations pratiques sur les deux villes pilotes (sources : Ville d'Aix-en-Provence / INSEE,
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
  const thumbClass = ev.thumb ? " " + ev.thumb : "";
  const distTxt = ev.distance != null ? ev.distance.toFixed(1).replace(".", ",") + " km" : "";
  return `
    <button class="event-card" data-id="${ev.id}">
      <div class="thumb${thumbClass}"></div>
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

  document.getElementById("detail-hero").className = "detail-hero" + (ev.thumb === "alt2" ? " blue" : "");
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
