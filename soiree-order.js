/* Whazup — Soirées rangées dans l'ordre : par jour, puis par heure (soirée d'abord), avec titres de jour. */
(function () {
  "use strict";
  try { if (typeof CATEGORY_LABELS === "object") CATEGORY_LABELS["Soirée"] = "Soirées"; } catch (e) {}

  try { // Soirées juste après Musique
    var ci = CATEGORIES.indexOf("Soirée");
    if (ci > 1) { CATEGORIES.splice(ci, 1); CATEGORIES.splice(CATEGORIES.indexOf("Musique") + 1, 0, "Soirée"); }
  } catch (e) {}

  try { // nouvelle rubrique « Spectacles » et nom clair pour « Expo »
    var si = CATEGORIES.indexOf("Soirée");
    if (CATEGORIES.indexOf("Spectacles") < 0) CATEGORIES.splice(si + 1, 0, "Spectacles");
    CATEGORY_COLORS["Spectacles"] = "#7B4FD6";
    CATEGORY_ICONS["Spectacles"] = "🎭";
    CATEGORY_LABELS["Expo"] = "Expos & visites";
  } catch (e) {}

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

  var F = window.__wzF = { when: null, kind: null, free: false };
  var KINDS = {
    club: /\bclub\b|\bdj\b|party|\brave\b|techno|\bhouse\b|electro|clubbing|\bafters?\b|\bnuit\b|night|disco|boiler/i,
    concert: /concert|\blive\b|showcase|\btour\b|acoustic|\bjazz\b|\brock\b|\brap\b|hip.?hop|release party/i,
    bar: /\bbar\b|ap[ée]ro|afterwork|pub\b|karaok|quiz|happy hour|guinguette|cocktail/i
  };
  function soireeOnly() { var c = state.selectedCategories; return c && c.size === 1 && c.has("Soirée"); }
  function passF(ev) {
    if (!soireeOnly() || ev.isPlace) return true;
    var now = new Date(), t = now.toISOString().slice(0, 10), tm = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    if (F.when === "tonight" && ev.date !== t) return false;
    if (F.when === "tomorrow" && ev.date !== tm) return false;
    if (F.when === "weekend") {
      var wd = new Date(ev.date + "T12:00:00").getDay(), lim = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
      if (!(ev.date >= t && ev.date <= lim && (wd === 5 || wd === 6 || wd === 0))) return false;
    }
    if (F.kind && !KINDS[F.kind].test((ev.title || "") + " " + (ev.place || ""))) return false;
    if (F.free && typeof eventPriceType === "function" && eventPriceType(ev) !== "free") return false;
    return true;
  }

  function install() {
    // appelé par home-polish.js (après le filtre de période, avant la coupe « Voir plus »)
    window.__wzReorder = function (all) {
      if (!Array.isArray(all)) return all;
      var cats = state.selectedCategories;
      var nightMode = cats && cats.size > 0 && Array.from(cats).every(function (c) { return NIGHT.indexOf(c) >= 0; });
      return all
        .filter(passF)
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

  function addBar() {
    var old = document.getElementById("wz-filters"); if (old) old.remove();
    if (!soireeOnly()) return;
    var fe = document.getElementById("event-list-featured"), li = document.getElementById("event-list");
    var anchor = (fe && li) ? ((fe.compareDocumentPosition(li) & 4) ? fe : li) : (fe || li);
    if (!anchor) return;
    var rows = [
      { key: "when", opts: [["tonight", "Ce soir"], ["tomorrow", "Demain"], ["weekend", "Ce week-end"]] },
      { key: "kind", opts: [["club", "Clubs & DJ"], ["concert", "Concerts"], ["bar", "Bars & afters"]] },
      { key: "free", opts: [[true, "Gratuit"]] }
    ];
    var box = document.createElement("div"); box.id = "wz-filters";
    rows.forEach(function (r) {
      var row = document.createElement("div"); row.className = "wz-frow";
      r.opts.forEach(function (o) {
        var b = document.createElement("button"); b.type = "button";
        b.className = "wz-fbtn" + (F[r.key] === o[0] ? " on" : ""); b.textContent = o[1];
        b.onclick = function () { F[r.key] = (F[r.key] === o[0]) ? (r.key === "free" ? false : null) : o[0]; renderDiscover(); };
        row.appendChild(b);
      });
      box.appendChild(row);
    });
    anchor.parentNode.insertBefore(box, anchor);
  }

  var busy = false;
  function addHeaders() {
    var list = document.getElementById("event-list");
    if (!list || busy) return;
    busy = true;
    try { addBar(); } catch (e) {}
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
  st.textContent += "html body.wz-v2 #view-discover > #wz-filters{order:7}#wz-filters{display:flex;flex-direction:column;gap:8px;margin:6px 0 10px}.wz-frow{display:flex;gap:8px;flex-wrap:wrap}" +
    ".wz-fbtn{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.07);color:#fff;font:600 13px system-ui,sans-serif;cursor:pointer}" +
    ".wz-fbtn.on{border:none;background:linear-gradient(135deg,#F2864B,#E85D3D);font-weight:700}";
  document.head.appendChild(st);

  function relabel() {
    document.querySelectorAll(".cat-chip-label,.quick-cat-label,.chip-btn,.cat-chip,[data-cat] span").forEach(function (n) {
      if (n.children.length === 0 && n.textContent.trim() === "Culture") n.textContent = "Soirées";
    });
  }
  try { new MutationObserver(relabel).observe(document.body, { childList: true, subtree: true }); relabel(); } catch (e) {}


  var cs = document.createElement("style");
  cs.textContent =
    "html body #view-discover .quick-cat.active .quick-cat-circle{border:3px solid #F2864B !important;box-shadow:0 0 0 4px rgba(242,134,75,.28),0 10px 22px -6px rgba(242,134,75,.7) !important;transform:translateY(-3px) scale(1.1) !important}" +
    "html body #view-discover .quick-cat.active .quick-cat-label{color:#fff !important;font-weight:800 !important;border-bottom:3px solid #F2864B;padding-bottom:2px}" +
    "html body #view-discover .home-category-quickbar:has(.quick-cat.active) .quick-cat:not(.active){opacity:.45}" +
    "html body #view-discover .quick-cat.active .quick-cat-circle::after,#category-chips .cat-chip.active .cat-chip-circle::after{content:'✓';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#F2864B;color:#fff;font:800 11px/18px system-ui;text-align:center;z-index:3}" +
    "html body #category-chips .cat-chip.active .cat-chip-circle{outline:3px solid #F2864B;outline-offset:1px;box-shadow:0 0 0 6px rgba(242,134,75,.28),0 8px 18px -4px rgba(242,134,75,.7) !important;transform:scale(1.12) !important;opacity:1 !important}" +
    "html body #category-chips .cat-chip.active .cat-chip-label{color:#fff !important;font-weight:800 !important;border-bottom:2px solid #F2864B}" +
    "html body #category-chips:has(.cat-chip.active) .cat-chip:not(.active){opacity:.45}";
  document.head.appendChild(cs);

  function boot() {
    install();
    var list = document.getElementById("event-list");
    if (!list) return setTimeout(boot, 500);
    var mo = new MutationObserver(function () { if (!busy) { mo.disconnect(); addHeaders(); mo.observe(list, { childList: true }); } });
    mo.observe(list, { childList: true });
    addHeaders();
    try { if (typeof renderCategoryChips === "function") renderCategoryChips(); } catch (e) {}
    try { if (typeof renderDiscover === "function") renderDiscover(); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 800); });
  else setTimeout(boot, 800);
})();
