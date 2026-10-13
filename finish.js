// Étape 3 : message clair quand aucune sortie ne correspond + boutons pour rebondir.
(function () {
  var MARK = "Aucun événement ne correspond";
  function reset(what) {
    try {
      if (what === "period" || what === "all") state.selectedPeriod = null;
      if (what === "cats" || what === "all") { if (state.selectedCategories && state.selectedCategories.clear) state.selectedCategories.clear(); state.selectedArrondissement = null; }
      if (what === "radius" && state.userPos) state.radiusKm = Math.min(100, Math.max(40, (state.radiusKm || 20) * 2));
      if (what === "all") { if (state.userPos) state.radiusKm = Math.max(state.radiusKm || 20, 40); }
      document.querySelectorAll(".stat[data-filter]").forEach(function (s) { s.classList.remove("active"); });
      renderDiscover();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {}
  }
  function enhance() {
    var el = document.getElementById("empty-state");
    if (!el || el.classList.contains("hidden") || el.dataset.wzFin) return;
    if ((el.textContent || "").indexOf(MARK) !== 0) return;
    el.dataset.wzFin = "1";
    var b = [];
    if (state.selectedPeriod) b.push(["period", "Voir toutes les dates"]);
    if (state.selectedCategories && state.selectedCategories.size) b.push(["cats", "Toutes les catégories"]);
    if (state.userPos) b.push(["radius", "Élargir autour de moi"]);
    if (!b.length) b.push(["all", "Tout réinitialiser"]);
    el.innerHTML =
      '<div class="wz-empty">' +
      '<div class="wz-empty-t">Rien ne correspond… pour l’instant</div>' +
      '<div class="wz-empty-d">Essaie une autre date ou une autre catégorie : il y a sûrement quelque chose près de toi.</div>' +
      '<div class="wz-empty-b">' + b.map(function (x) { return '<button type="button" data-wz-reset="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
    el.querySelectorAll("[data-wz-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () { reset(btn.dataset.wzReset); });
    });
  }
  function watch() {
    var el = document.getElementById("empty-state");
    if (!el) return setTimeout(watch, 600);
    new MutationObserver(function () { delete el.dataset.wzFin; setTimeout(enhance, 30); }).observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    enhance();
  }
  watch();
})();
