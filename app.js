// What's happen — pilote web (Phase 1)
// Aucune dépendance externe : tout est en JavaScript natif.

const CITIES = {
  aix: { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  st:  { name: "Saint-Tropez",    lat: 43.2677, lng: 6.6407 },
};

const SEED_EVENTS = [
  {
    id: "aix-jazz",
    city: "aix",
    category: "Musique",
    title: "Concert Jazz — Cours Mirabeau",
    date: "2026-08-21",
    time: "20:30",
    place: "Cours Mirabeau, Aix-en-Provence",
    lat: 43.5263, lng: 5.4486,
    price: "Gratuit",
    thumb: "",
    description: "Une scène en plein air pour un concert de jazz manouche, organisé par l'association des commerçants du Cours Mirabeau. Ambiance conviviale garantie.",
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
    description: "Producteurs locaux, artisanat et petite restauration en plein cœur du centre historique d'Aix, tous les jeudis soir en été.",
  },
  {
    id: "aix-street",
    city: "aix",
    category: "Festival",
    title: "Arts de rue — Salon-de-Provence",
    date: "2026-08-23",
    time: "14:00",
    place: "Centre-ville, Salon-de-Provence",
    lat: 43.6408, lng: 5.0968,
    price: "Gratuit",
    thumb: "",
    description: "Compagnies de théâtre de rue, cirque et musiciens ambulants investissent le centre-ville pour une après-midi festive.",
  },
  {
    id: "st-dj",
    city: "st",
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
    id: "st-marche",
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
    id: "st-regate",
    city: "st",
    category: "Sport",
    title: "Régate — Golfe de Saint-Tropez",
    date: "2026-08-23",
    time: "10:00",
    place: "Golfe de Saint-Tropez",
    lat: 43.2500, lng: 6.6600,
    price: "Gratuit (spectateurs)",
    thumb: "",
    description: "Régate de voitiers classiques dans le golfe, observable depuis les quais du port et le sentier du littoral.",
  },
];

const CATEGORIES = ["Musique", "Marché", "Festival", "Sport", "Soirée", "Expo"];

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
