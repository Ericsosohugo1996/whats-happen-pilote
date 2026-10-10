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
