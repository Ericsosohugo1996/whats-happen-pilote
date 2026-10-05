// ---- accueil plus court et plus lisible (chargé en dernier, après perf-boost.js) ----
// 1) la liste n'affiche plus les 3 000 événements d'un coup : les 30 premiers, puis un bouton "Voir plus"
//    (les filtres, la recherche, les compteurs et la carte continuent de travailler sur la liste complète)
// 2) la fiche "À propos de la ville" (500 px de texte) est repliée par défaut, un tap l'ouvre
// 3) les gros boutons "Retour aux choix" et "Recevoir par email" deviennent de petites pastilles
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
  var origArr = renderArrondissementFilter;
  renderArrondissementFilter = function () {
    var r = origArr.apply(this, arguments);
    try { polish(); } catch (e) {}
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
    "#btn-newsletter{display:inline-block !important;width:auto !important;margin:10px 0 14px 16px !important;padding:8px 14px !important;font-size:12.5px !important;font-weight:600 !important;background:transparent !important;color:rgba(255,255,255,.85) !important;border:1px solid rgba(255,255,255,.22) !important;border-radius:999px !important;box-shadow:none !important}" +
    "#btn-discover-back{display:inline-block !important;margin:14px 0 0 16px !important}";
  document.head.appendChild(css);
  try { polish(); } catch (e) {}
})();
