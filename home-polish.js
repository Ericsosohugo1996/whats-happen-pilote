// ---- accueil plus court et plus lisible (chargé en dernier, après perf-boost.js) ----
// 1) la liste n'affiche plus les 3 000 événements d'un coup : les 30 premiers, puis un bouton "Voir plus"
//    (les filtres, la recherche, les compteurs et la carte continuent de travailler sur la liste complète)
// 2) la fiche "À propos de la ville" (500 px de texte) est repliée par défaut, un tap l'ouvre
// 3) pendant le chargement des données, de fausses cartes grises (squelettes) remplacent l'écran vide
// 4) retour tactile : une carte ou un bouton s'enfonce légèrement quand on appuie dessus
// 3c) en-tête réduit à une seule ligne (le bouton "Publier" du haut fait doublon avec celui du bas)
// 3b) les gros boutons "Retour aux choix" et "Recevoir par email" deviennent de petites pastilles
// Pour tout annuler : retirer la ligne <script src="home-polish.js"> dans index.html.
(function () {
  "use strict";
  if (typeof renderDiscover !== "function" || typeof visibleEvents !== "function" || typeof renderArrondissementFilter !== "function") return;
  var FIRST = 30, STEP = 40;
  var page = FIRST, sig = "", full = [], shown = 0;

  function signature() {
    try {
      return [state.city, state.userPos ? 1 : 0, state.radiusKm, state.selectedPeriod,
        Array.from(state.selectedCategories || []).sort().join(","), state.selectedArrondissement,
        typeof __searchQuery !== "undefined" ? __searchQuery : "",
        typeof __selectedBarStyle !== "undefined" ? __selectedBarStyle : ""].join("|");
    } catch (e) { return ""; }
  }

  var origVisible = visibleEvents;
  visibleEvents = function () {
    var all = origVisible.apply(this, arguments);
    full = all; shown = all.length;
    var s = signature();
    if (s !== sig) { sig = s; page = FIRST; }
    // recherche d'ambiance : elle filtre les cartes déjà affichées, on ne coupe donc rien
    if (typeof __discoverMoodQuery !== "undefined" && __discoverMoodQuery) return all;
    if (!Array.isArray(all) || all.length <= page + 10) return all;
    var keep = [], n = 0;
    for (var i = 0; i < all.length; i++) {
      var ev = all[i];
      if (ev.featured) keep.push(ev);
      else if (n < page) { keep.push(ev); n++; }
    }
    shown = keep.length;
    return keep;
  };

  // la carte garde la liste complète (perf-boost.js n'en dessine que les plus proches)
  if (typeof renderMap === "function") {
    var origMap = renderMap;
    renderMap = function (events) {
      if (Array.isArray(events) && full.length > events.length) events = full;
      return origMap.call(this, events);
    };
  }

  function el(id) { return document.getElementById(id); }
  function polish() {
    // --- bouton "Voir plus"
    var list = el("event-list"), more = el("wz-more");
    var rest = full.length - shown;
    if (list && rest > 0) {
      if (!more) {
        more = document.createElement("button");
        more.type = "button"; more.id = "wz-more";
        more.addEventListener("click", function () { page += STEP; renderDiscover(); });
        list.parentNode.insertBefore(more, list.nextSibling);
      }
      more.textContent = "Voir " + Math.min(STEP, rest) + " événements de plus · " + rest + " restants";
      more.hidden = false;
    } else if (more) more.hidden = true;

    // --- fiche ville repliable
    var ci = el("city-info"), tg = el("wz-ci-toggle");
    if (ci) {
      if (!tg) {
        tg = document.createElement("button");
        tg.type = "button"; tg.id = "wz-ci-toggle";
        tg.setAttribute("aria-expanded", "false");
        tg.addEventListener("click", function () {
          var open = ci.classList.toggle("wz-open");
          tg.setAttribute("aria-expanded", open ? "true" : "false");
        });
        ci.parentNode.insertBefore(tg, ci);
      }
      var nm = ci.querySelector(".ci-name");
      tg.textContent = "ℹ️ À propos de " + (nm ? nm.textContent : "cette ville");
      tg.hidden = ci.classList.contains("hidden");
    }
  }
  // --- squelettes : tant que les 3 gros fichiers de données ne sont pas arrivés (25 s max)
  var T0 = Date.now();
  function loading() {
    if (Date.now() - T0 > 25000) return false;
    if (typeof window.__wzDataLoading === "boolean") return window.__wzDataLoading;
    try {
      return !(state.dataTourismeEvents.length && state.dataTourismePlaces.length && state.osmBars.length);
    } catch (e) { return false; }
  }
  function skeleton() {
    var list = el("event-list"), sk = el("wz-skel");
    var need = loading() && list && list.querySelectorAll(".event-card").length < 8;
    document.body.classList.toggle("wz-loading", !!need);
    if (!list) return;
    if (need) {
      if (!sk) {
        sk = document.createElement("div");
        sk.id = "wz-skel"; sk.setAttribute("aria-hidden", "true");
        var h = "";
        for (var i = 0; i < 6; i++) h += '<div class="wz-skel-card"><i></i><div><b></b><b></b><b></b></div></div>';
        sk.innerHTML = h;
        list.parentNode.insertBefore(sk, list.nextSibling);
      }
      sk.hidden = false;
      // on revérifie dans une seconde : le redessin final de l'appli suffit souvent, mais pas toujours
      if (!skeleton.t) skeleton.t = setTimeout(function () { skeleton.t = 0; try { skeleton(); } catch (e) {} }, 1000);
    } else if (sk) sk.hidden = true;
  }

  var origArr = renderArrondissementFilter;
  renderArrondissementFilter = function () {
    var r = origArr.apply(this, arguments);
    try { polish(); skeleton(); } catch (e) {}
    return r;
  };

  var css = document.createElement("style");
  css.textContent =
    "#city-info:not(.wz-open){display:none !important}" +
    "#wz-ci-toggle{display:flex;align-items:center;justify-content:space-between;gap:8px;width:calc(100% - 32px);margin:12px 16px;padding:13px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:700 13.5px inherit;font-family:inherit;text-align:left;cursor:pointer}" +
    "#wz-ci-toggle::after{content:'›';font-size:20px;line-height:1;transition:transform .2s;transform:rotate(90deg)}" +
    "#wz-ci-toggle[aria-expanded=true]::after{transform:rotate(-90deg)}" +
    "#wz-ci-toggle[hidden]{display:none !important}" +
    "#wz-more{display:block;width:calc(100% - 32px);margin:16px;padding:15px 18px;border:0;border-radius:14px;background:linear-gradient(135deg,#F2C879,#E85D3D);color:#fff;font:700 14px inherit;font-family:inherit;cursor:pointer;box-shadow:0 6px 16px -6px rgba(232,93,61,.55)}" +
    "#wz-more[hidden]{display:none !important}" +
    "#wz-skel{margin-top:10px}#wz-skel[hidden]{display:none !important}" +
    ".wz-skel-card{display:flex;gap:12px;align-items:center;margin:0 0 10px;padding:12px;border-radius:16px;background:#fff;opacity:.92}" +
    ".wz-skel-card i{flex:none;width:64px;height:64px;border-radius:14px}" +
    ".wz-skel-card div{flex:1;display:flex;flex-direction:column;gap:9px}" +
    ".wz-skel-card b{display:block;height:11px;border-radius:6px}" +
    ".wz-skel-card b:nth-child(1){width:35%}.wz-skel-card b:nth-child(2){width:85%}.wz-skel-card b:nth-child(3){width:60%}" +
    ".wz-skel-card i,.wz-skel-card b{background:linear-gradient(100deg,#ececec 30%,#f7f7f7 50%,#ececec 70%);background-size:200% 100%;animation:wzShim 1.4s ease-in-out infinite}" +
    "@keyframes wzShim{0%{background-position:100% 0}100%{background-position:-100% 0}}" +
    "body.wz-loading #empty-state{display:none !important}" +
    ".btn-ghost{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}" +
    "@media (max-width:480px){" +
      ".topbar{flex-wrap:nowrap !important;gap:6px !important;padding:10px 14px !important}" +
      ".topbar .brand{margin-right:auto}.topbar .brand-word{display:none}" +
      ".topbar .btn-ghost{margin:0 !important;padding:8px 12px !important;font-size:12.5px !important;white-space:nowrap}" +
      "#btn-publish-header{display:none !important}" +
    "}" +
    "body:has(#view-discover:not(.hidden)) #unified-explore-btn{box-shadow:0 0 0 100vmax #0E1526;clip-path:inset(-10px -100vmax 0 -100vmax)}" +
    ".home-quickbar-title{color:rgba(255,255,255,.92) !important}" +
    "*{-webkit-tap-highlight-color:transparent}" +
    ".event-card,.featured-card,.chip-btn,.stat,#wz-more,#wz-ci-toggle,.bottomnav button{transition:transform .12s ease}" +
    ".event-card:active,.featured-card:active,.stat:active,#wz-more:active,#wz-ci-toggle:active{transform:scale(.98)}" +
    ".chip-btn:active,.bottomnav button:active{transform:scale(.95)}" +
    "@media (prefers-reduced-motion:reduce){.wz-skel-card i,.wz-skel-card b{animation:none}.event-card:active,.featured-card:active,.stat:active,.chip-btn:active{transform:none}}" +
    "#btn-newsletter{display:inline-block !important;width:auto !important;margin:10px 0 14px 16px !important;padding:8px 14px !important;font-size:12.5px !important;font-weight:600 !important;background:transparent !important;color:rgba(255,255,255,.85) !important;border:1px solid rgba(255,255,255,.22) !important;border-radius:999px !important;box-shadow:none !important}" +
    "#btn-discover-back{display:inline-block !important;margin:14px 0 0 16px !important}" +
    /* v4 : blocs de l'accueil plus compacts */
    "#view-discover .stats-banner{gap:8px !important;margin:0 0 12px !important}" +
    "#view-discover .stats-banner .stat{padding:9px 4px 8px !important;min-height:0 !important;border-radius:14px !important}" +
    "#view-discover .stats-banner .stat-icon{display:none !important}" +
    "#view-discover .stats-banner .num{font-size:22px !important;line-height:1.05 !important;margin:0 !important}" +
    "#view-discover .stats-banner .label{font-size:9.5px !important;letter-spacing:.03em !important;margin-top:3px !important;line-height:1.15 !important}" +
    "#view-discover .week-strip-banner{margin:0 0 10px !important}" +
    "#view-discover .week-strip-hint{padding:0 2px 5px !important}" +
    "#view-discover .week-day-btn{flex-basis:50px !important;padding:6px 3px !important;gap:1px !important;border-radius:12px !important}" +
    "#view-discover .week-day-btn .week-day-count{font-size:14px !important}" +
    "#wz-ci-toggle{margin:8px 16px !important;padding:11px 16px !important}" +
    "#btn-newsletter{margin:8px 0 10px 16px !important}" +
    "#btn-discover-back{margin:10px 0 0 16px !important}" +
    "#souvenir-fab{width:44px !important;height:44px !important;font-size:18px !important;right:14px !important;bottom:96px !important;opacity:.92;box-shadow:0 3px 10px rgba(0,0,0,.35) !important}";
  document.head.appendChild(css);
  try { polish(); skeleton(); } catch (e) {}

  /* v4 : cartes d'événement plus honnêtes.
     - prix inconnu ("Voir sur place") : on n'affiche plus « Payant »
     - plus de « · » orphelin quand l'heure est vide */
  var origCard = window.eventCardHTML;
  if (typeof origCard === "function") {
    window.eventCardHTML = function (ev) {
      var h = origCard.apply(this, arguments);
      try {
        if (typeof h === "string") {
          var p = ev && ev.price ? String(ev.price).toLowerCase() : "";
          if (!p || p.indexOf("voir sur place") !== -1) {
            h = h.replace(/<div class="dist paid">[^<]*<\/div>/, "");
          }
          h = h.replace(/\s*·\s*(<\/div>)/g, "$1");
        }
      } catch (e) {}
      return h;
    };
  }
})();
