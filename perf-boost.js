// ---- coup de fouet de fluidité (chargé en dernier, ne change aucune règle de l'appli) ----
// 1) pendant qu'un redessin de l'écran est en cours, on ne recalcule plus 3 à 4 fois la même
//    liste d'événements (allEvents / baseVisibleEvents sont mémorisées le temps d'un redessin)
// 2) les redessins qui arrivent en rafale (chargement des 6 sources de données au démarrage,
//    frappe dans la recherche) sont regroupés en un seul
// 3) tant que l'animation d'intro est à l'écran, on attend pour redessiner (elle cache tout)
// 4) la carte ne crée plus que les 300 repères les plus proches (au lieu de plusieurs milliers)
// 5) le navigateur ne calcule plus l'affichage des cartes d'événements hors écran
// Pour tout annuler : retirer la ligne <script src="perf-boost.js"> dans index.html.
(function () {
  "use strict";
  if (typeof renderDiscover !== "function" || typeof allEvents !== "function" || typeof baseVisibleEvents !== "function") return;
  var T0 = Date.now();
  var MAX_MARKERS = 300;
  var debug = /[?&]perf(=|&|$)/.test(location.search);
  var inRender = 0, cacheAll = null, cacheBase = null, last = 0, timer = null;

  var origAll = allEvents;
  allEvents = function () {
    if (!inRender) return origAll.apply(this, arguments);
    if (!cacheAll) cacheAll = origAll.apply(this, arguments);
    return cacheAll;
  };
  var origBase = baseVisibleEvents;
  baseVisibleEvents = function () {
    if (!inRender) return origBase.apply(this, arguments);
    if (!cacheBase) cacheBase = origBase.apply(this, arguments);
    return cacheBase;
  };

  if (typeof renderMap === "function") {
    var origMap = renderMap;
    renderMap = function (events) {
      if (Array.isArray(events) && events.length > MAX_MARKERS) {
        events = events.slice().sort(function (a, b) {
          return (a.distance == null ? 1e9 : a.distance) - (b.distance == null ? 1e9 : b.distance);
        }).slice(0, MAX_MARKERS);
      }
      return origMap.call(this, events);
    };
  }

  var origRender = renderDiscover;
  function run() {
    last = Date.now();
    var t = debug ? performance.now() : 0;
    inRender++;
    try { origRender(); }
    finally {
      inRender--;
      if (!inRender) { cacheAll = null; cacheBase = null; }
      if (debug) console.log("[perf] renderDiscover " + Math.round(performance.now() - t) + " ms");
    }
  }
  function schedule(wait) {
    if (timer) return;
    timer = setTimeout(function () { timer = null; renderDiscover(); }, wait);
  }
  renderDiscover = function () {
    if (inRender) return origRender();
    // l'intro cache tout : inutile de redessiner dessous, ça ferait ramer l'animation
    if (document.getElementById("wz-intro")) { schedule(250); return; }
    var gap = Date.now() - T0 < 20000 ? 500 : 100;
    var wait = last + gap - Date.now();
    if (wait <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      run();
    } else schedule(wait);
  };

  var css = document.createElement("style");
  css.textContent = ".event-card{content-visibility:auto;contain-intrinsic-size:auto 96px}";
  document.head.appendChild(css);
})();
