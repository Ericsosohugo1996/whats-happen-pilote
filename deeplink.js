// Whazup — liens directs (Instagram, WhatsApp…) : ouvrent une ville et un écran précis, sans localisation.
// Exemples :
//   https://whazup.fr/?ville=paris&page=nouveautes
//   https://whazup.fr/?ville=toulouse&page=accueil
// Pour retirer cette fonction : supprimer ce fichier sur GitHub.
(function () {
  "use strict";
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var ville = (q.get("ville") || "").trim();
  if (!ville) return;
  var page = (q.get("page") || "nouveautes").toLowerCase();

  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

  // masque tout de suite les écrans d'introduction pour éviter un flash
  var hide = document.createElement("style");
  hide.id = "wz-deeplink-hide";
  hide.textContent = "#wz-intro,#splash-screen,#brand-intro-screen,#choice-screen{display:none!important}";
  document.head.appendChild(hide);

  function resolveKey() {
    var want = fold(ville);
    try {
      if (CITIES[want]) return want;
      var keys = Object.keys(CITIES);
      for (var i = 0; i < keys.length; i++) {
        if (fold(CITIES[keys[i]].name) === want) return keys[i];
      }
    } catch (e) {}
    return null;
  }

  function cleanup() {
    ["wz-intro", "splash-screen"].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    try { hideBrandIntroScreen(); } catch (e) {}
    var cs = document.getElementById("choice-screen"); if (cs) cs.classList.add("hidden");
    var h = document.getElementById("wz-deeplink-hide"); if (h) h.remove();
  }

  function unhide() { var h = document.getElementById("wz-deeplink-hide"); if (h) h.remove(); }

  var tries = 0;
  function start() {
    tries++;
    var ok = false;
    try { ok = typeof state !== "undefined" && typeof CITIES !== "undefined" && typeof __newFindsShow === "function" && typeof __arrivalShow === "function" && typeof allEvents === "function"; } catch (e) {}
    if (!ok) { if (tries < 100) return setTimeout(start, 100); unhide(); return; }
    var key = resolveKey();
    if (!key) { unhide(); return; }
    try { state.city = key; state.userPos = null; } catch (e) {}
    try { __hasPickedCity = true; } catch (e) {}
    cleanup();
    var go = function () {
      var open = (page === "accueil" || page === "decouvre") ? __arrivalShow : __newFindsShow;
      try { open(); } catch (e) {}
    };
    var ens = (typeof window.__wzEnsureData === "function") ? window.__wzEnsureData() : Promise.resolve();
    var done = false;
    function fire() { if (done) return; done = true; go(); }
    Promise.resolve(ens).then(function () {
      var n = 0;
      (function wait() {
        var has = false;
        try { has = allEvents().some(function (e) { return e.city === key; }); } catch (e) {}
        if (has || n++ > 40) fire(); else setTimeout(wait, 150);
      })();
    }, fire);
    setTimeout(fire, 8000);
  }
  if (document.readyState === "complete") setTimeout(start, 50);
  else window.addEventListener("load", function () { setTimeout(start, 50); });
})();

/* ---- Nouveautés plus utiles : à venir, dans l'ordre des dates, 2 par lieu maximum ---- */
(function () {
  "use strict";
  if (window.__wzNfCurated) return; window.__wzNfCurated = true;
  function venue(ev) { return String(ev.place || "").split(",")[0].trim().toLowerCase().slice(0, 40) || ev.id; }
  function curate(list, cityKey) {
    var today = new Date(); today = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var lim = new Date(Date.now() + 28 * 86400000); lim = lim.getFullYear() + "-" + String(lim.getMonth() + 1).padStart(2, "0") + "-" + String(lim.getDate()).padStart(2, "0");
    var keep = [], others = [];
    list.forEach(function (ev) {
      var isNew = false;
      try { isNew = ev.city === cityKey && __isNewFind(ev); } catch (e) {}
      if (!isNew) { others.push(ev); return; }
      if (ev.isPlace || ev.category === "Marché" || ev.scene === "marche") return;
      if (ev.date && (ev.date < today || ev.date > lim)) return;
      keep.push(ev);
    });
    keep.sort(function (a, b) {
      var ai = a.insolite ? 0 : 1, bi = b.insolite ? 0 : 1; if (ai !== bi) return ai - bi;
      var ap = a.photo || a.thumb ? 0 : 1, bp = b.photo || b.thumb ? 0 : 1;
      if ((a.date || "9") !== (b.date || "9")) return (a.date || "9") < (b.date || "9") ? -1 : 1;
      return ap - bp;
    });
    var seen = {}, out = [];
    keep.forEach(function (ev) {
      var v = venue(ev); seen[v] = (seen[v] || 0) + 1;
      if (seen[v] <= 2 && out.length < 15) out.push(ev);
    });
    var base = Date.now();
    out = out.map(function (ev, i) { var c = Object.assign({}, ev); c.createdAt = base - i * 1000; return c; });
    return others.concat(out);
  }
  function install() {
    if (typeof __newFindsShow !== "function" || typeof allEvents !== "function") return setTimeout(install, 300);
    var orig = __newFindsShow;
    window.__newFindsShow = function () {
      var realAll = allEvents;
      try {
        var key = state.userPos ? nearestCityKey() : state.city;
        window.allEvents = function () { return curate(realAll(), key); };
      } catch (e) {}
      try { return orig.apply(this, arguments); } finally { window.allEvents = realAll; }
    };
  }
  install();
})();

/* ---- Listes d'événements : on enlève le temps à pied (🚶 xx min) ---- */
(function () {
  "use strict";
  function clean(root) {
    try {
      root.querySelectorAll(".explore-pick span").forEach(function (sp) {
        if (/^\s*🚶\s*\d+\s*min\s*$/.test(sp.textContent)) {
          var nx = sp.nextElementSibling;
          if (nx) nx.textContent = nx.textContent.replace(/^\s*·\s*/, "");
          sp.remove();
        }
      });
    } catch (e) {}
  }
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; clean(document); }, 60); })
    .observe(document.documentElement, { childList: true, subtree: true });
  clean(document);
})();
