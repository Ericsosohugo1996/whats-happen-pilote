/* Whazup — Soirées rangées dans l'ordre : par jour, puis par heure (soirée d'abord), avec titres de jour. */
(function () {
  "use strict";
  try { if (typeof CATEGORY_LABELS === "object") CATEGORY_LABELS["Soirée"] = "Soirées"; } catch (e) {}

  var NIGHT = ["Soirée", "Musique", "Bar"];
  function rank(ev) { // 0 = vraie soirée (20h-5h), 1 = début de soirée, 2 = le reste
    var t = ev.time ? parseInt(String(ev.time).split(":")[0], 10) : NaN;
    if (!isNaN(t) && (t >= 20 || t < 5)) return 0;
    if (!isNaN(t) && t >= 17) return 1;
    return 2;
  }

  function nightKey(t) {
    if (!t) return 200;
    var h = parseInt(String(t).split(":")[0], 10), m = parseInt(String(t).split(":")[1] || "0", 10);
    if (isNaN(h)) return 200;
    var k;
    if (h >= 18) k = h - 18; else if (h < 5) k = h + 6; else k = 100 + h;
    return k * 60 + (isNaN(m) ? 0 : m);
  }
  function plainKey(t) {
    if (!t) return 9999;
    var h = parseInt(String(t).split(":")[0], 10), m = parseInt(String(t).split(":")[1] || "0", 10);
    return isNaN(h) ? 9999 : h * 60 + (isNaN(m) ? 0 : m);
  }

  function install() {
    if (typeof window.visibleEvents !== "function" || typeof baseVisibleEvents !== "function") return false;
    window.visibleEvents = function () {
      var today = new Date().toISOString().slice(0, 10);
      var cats = state.selectedCategories;
      var nightMode = cats && cats.size > 0 && Array.from(cats).every(function (c) { return NIGHT.indexOf(c) >= 0; });
      return baseVisibleEvents()
        .filter(function (ev) { return matchesPeriod(ev, state.selectedPeriod); })
        .filter(function (ev) { return ev.isPlace || !ev.date || ev.date >= today; })
        .filter(function (ev) { return !(nightMode && !ev.isPlace && !ev.time && ev.source === "paris-opendata"); })
        .sort(function (a, b) {
          var aD = !a.isPlace && a.date ? a.date : "9999-99-99";
          var bD = !b.isPlace && b.date ? b.date : "9999-99-99";
          if (aD !== bD) return aD < bD ? -1 : 1;
          if (nightMode) {
            if (rank(a) !== rank(b)) return rank(a) - rank(b);
            var d = nightKey(a.time) - nightKey(b.time);
            if (d) return d;
          } else {
            var d2 = plainKey(a.time) - plainKey(b.time);
            if (d2) return d2;
          }
          return (a.distance || 0) - (b.distance || 0);
        });
    };
    return true;
  }

  function dayTitle(iso) {
    var now = new Date();
    var t = now.toISOString().slice(0, 10);
    var tm = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    if (iso === t) return "Aujourd’hui";
    if (iso === tm) return "Demain";
    var s = new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var busy = false;
  function addHeaders() {
    var list = document.getElementById("event-list");
    if (!list || busy) return;
    busy = true;
    try {
      list.querySelectorAll(".wz-day").forEach(function (n) { n.remove(); });
      var byId = {};
      (typeof allEvents === "function" ? allEvents() : []).forEach(function (e) { byId[e.id] = e; });
      var last = null, n = 0;
      list.querySelectorAll(".event-card").forEach(function (card) {
        var ev = byId[card.dataset.id];
        if (!ev || ev.isPlace || !ev.date) return;
        if (ev.date !== last) {
          last = ev.date; n++;
          var h = document.createElement("div");
          h.className = "wz-day";
          h.textContent = dayTitle(ev.date);
          card.parentNode.insertBefore(h, card);
        }
      });
    } catch (e) {}
    busy = false;
  }

  var st = document.createElement("style");
  st.textContent = ".wz-day{position:sticky;top:58px;z-index:5;margin:18px 0 8px;padding:7px 12px;border-radius:10px;" +
    "font:700 13px/1.2 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#fff;" +
    "background:linear-gradient(135deg,#F2864B,#E85D3D);width:fit-content;box-shadow:0 2px 8px rgba(0,0,0,.25)}";
  document.head.appendChild(st);

  function relabel() {
    document.querySelectorAll(".cat-chip-label,.quick-cat-label,.chip-btn,.cat-chip,[data-cat] span").forEach(function (n) {
      if (n.children.length === 0 && n.textContent.trim() === "Culture") n.textContent = "Soirées";
    });
  }
  try { new MutationObserver(relabel).observe(document.body, { childList: true, subtree: true }); relabel(); } catch (e) {}

  function boot() {
    install();
    var list = document.getElementById("event-list");
    if (!list) return setTimeout(boot, 500);
    var mo = new MutationObserver(function () { if (!busy) { mo.disconnect(); addHeaders(); mo.observe(list, { childList: true }); } });
    mo.observe(list, { childList: true });
    addHeaders();
    try { if (typeof renderDiscover === "function") renderDiscover(); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 800); });
  else setTimeout(boot, 800);
})();
