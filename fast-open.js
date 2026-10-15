// ---- Ouverture rapide : les visiteurs qui reviennent arrivent directement sur les événements ----
// Avant : écran de démarrage (3,4 s) → écran de bienvenue → « Me localiser / Visiter » → accueil.
// Maintenant : si la personne a déjà choisi une ville (ou sa position) lors d'une visite précédente,
// l'appli s'ouvre tout de suite sur les événements de cette ville. Les nouveaux visiteurs voient
// l'accueil habituel, une seule fois.
// Pour revoir l'ancienne ouverture complète : ajouter ?intro=1 à la fin de l'adresse du site.
// Pour tout annuler : retirer la ligne <script src="fast-open.js"> dans index.html.
(function () {
  "use strict";

  var KEY = "wz_last_open_v1";
  var last = null;
  try { last = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { last = null; }
  if (/[?&]intro=1/.test(location.search)) last = null;
  var fast = !!(last && typeof last.city === "string" && last.city);

  // ---- on passe les écrans d'accueil (uniquement pour ceux qui reviennent) ----
  if (fast) {
    try {
      var css = document.createElement("style");
      css.id = "wz-fast-css";
      css.textContent = "#splash-screen,#brand-intro-screen,#choice-screen,#arrival-searching-overlay{display:none!important}";
      document.head.appendChild(css);
      var sp = document.getElementById("splash-screen");
      if (sp) sp.remove();
      // app.js appelle cette fonction à la fin du délai de l'écran de démarrage : on la neutralise
      window.showBrandIntroScreen = function () {};
    } catch (e) {}
  }

  // on ne retient un choix que s'il vient d'un vrai geste de la personne (pas d'un réglage automatique au démarrage)
  var touched = false;
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, function () { touched = true; }, true);
  });

  function cityOk(k) { try { return !!(CITIES && CITIES[k]); } catch (e) { return false; } }

  function applyCity(key) {
    state.city = key;
    state.userPos = null;
    state.selectedPeriod = null;
    state.selectedCategories = new Set();
    state.selectedArrondissement = null;
    state.radiusKm = 20;
    try { __hasPickedCity = true; } catch (e) {}
    try { __hasPickedFilter = true; } catch (e) {}
    renderDiscover();
    try { if (typeof renderCategoryChips === "function") renderCategoryChips(); } catch (e) {}
  }

  // si la personne avait utilisé sa position et que l'autorisation est déjà donnée, on la reprend sans rien demander
  function upgradeToPosition() {
    try {
      if (!last.pos || !navigator.geolocation || !navigator.permissions || !navigator.permissions.query) return;
      navigator.permissions.query({ name: "geolocation" }).then(function (st) {
        if (st.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(function (p) {
          try {
            state.userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
            renderDiscover();
          } catch (e) {}
        }, function () {}, { timeout: 8000, maximumAge: 600000 });
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- on retient le dernier choix pour la prochaine ouverture ----
  function remember() {
    try {
      if (!touched || typeof state === "undefined" || !state.city) return;
      if (typeof __hasPickedCity === "undefined" || !__hasPickedCity) return;
      // pendant « Prépare ton séjour » la ville est changée provisoirement : on ne la retient pas
      try { if (typeof __exploreSavedCity !== "undefined" && __exploreSavedCity !== undefined) return; } catch (e) {}
      if (!cityOk(state.city)) return;
      var v = JSON.stringify({ city: state.city, pos: !!state.userPos, t: Date.now() });
      if (localStorage.getItem(KEY) !== v) localStorage.setItem(KEY, v);
    } catch (e) {}
  }

  function install() {
    try {
      if (typeof renderDiscover !== "function") return;
      var orig = renderDiscover;
      renderDiscover = function () {
        var r = orig.apply(this, arguments);
        try { remember(); } catch (e) {}
        return r;
      };
    } catch (e) {}
    if (fast && cityOk(last.city)) {
      try { applyCity(last.city); upgradeToPosition(); } catch (e) { console.error("Ouverture rapide impossible", e); }
    }
  }

  // on attend que tous les scripts soient chargés (le chargeur de données se met en place juste après)
  function boot() {
    try { if (typeof CITIES === "undefined" || typeof state === "undefined" || typeof renderDiscover !== "function") return setTimeout(boot, 200); } catch (e) { return setTimeout(boot, 200); }
    setTimeout(install, 150);
  }
  if (document.readyState === "complete") setTimeout(boot, 50);
  else window.addEventListener("load", function () { setTimeout(boot, 50); });
})();
