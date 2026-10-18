// ---- Accueil en rangées glissantes, avec de grandes photos (comme Airbnb) ----
// Ajoute sous les raccourcis des rangées : Ce soir, Ce week-end, Concerts, Spectacles, Expos, En famille.
// Seuls les événements qui ont une vraie photo y figurent ; la liste complète reste juste en dessous.
// Pour tout annuler : retirer la ligne <script src="home-rows.js"> dans index.html.
(function () {
  "use strict";

  var ROWS = [
    { id: "tonight", title: "Ce soir", chip: "wz-tonight" },
    { id: "weekend", title: "Ce week-end", chip: "wz-weekend" },
    { id: "tomorrow", title: "Demain", chip: "tomorrow", onlySelected: true },
    { id: "music", title: "Concerts et musique", cats: ["Musique", "Musique classique"], days: 21, quick: "Musique" },
    { id: "show", title: "Spectacles", cats: ["Spectacles"], days: 21, quick: "Spectacles" },
    { id: "expo", title: "Expos à voir", cats: ["Expo"], days: 30 },
    { id: "family", title: "En famille", cats: ["Famille"], days: 21 }
  ];
  var MIN_CARDS = 3, MAX_CARDS = 10;

  var CSS = [
    "html body.wz-v2 #view-discover > #wz-rows{order:4;margin:4px 0 10px}",
    "#wz-rows .wzr{margin:0 0 18px}",
    "#wz-rows .wzq-box{margin:0 16px;padding:18px;border-radius:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}",
    "#wz-rows .wzq-box h2{margin:0 0 6px;font-family:Fraunces,Georgia,serif;font-size:18px;color:#fff !important}",
    "#wz-rows .wzq-box p{margin:0 0 12px;font-size:14px;line-height:1.45;color:#c3c8d6}",
    "#wz-rows .wzq-chips{display:flex;flex-wrap:wrap;gap:8px}",
    "#wz-rows .wzq-chip{border:0;cursor:pointer;font:inherit;font-weight:700;font-size:14px;color:#14213D;background:linear-gradient(135deg,#F2C879,#E85D3D);padding:10px 14px;border-radius:999px}",
    "#wz-rows .wzr-h{display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin:0 0 10px}",
    "html body #view-discover #wz-rows .wzr-h h2{margin:0;font-family:Fraunces,Georgia,serif;font-size:19px;font-weight:600;color:#fff !important;opacity:1 !important;padding:0 !important;text-align:left}",
    "#wz-rows .wzr-all{border:0;background:rgba(255,255,255,.1);color:#fff;width:32px;height:32px;border-radius:50%;font-size:17px;cursor:pointer;font-family:inherit}",
    "#wz-rows .wzr-s{display:flex;align-items:flex-start;gap:12px;overflow-x:auto;padding:0 16px 4px;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch}",
    "#wz-rows .wzr-s::-webkit-scrollbar{display:none}",
    "#wz-rows .wzr-c{flex:0 0 156px;width:156px;min-width:156px;max-width:156px;box-sizing:border-box;overflow:hidden;display:block;scroll-snap-align:start;border:0;background:none;padding:0;text-align:left;color:#fff;cursor:pointer;font-family:inherit}",
    "#wz-rows .wzr-i{display:block;width:156px;height:156px;border-radius:18px;object-fit:cover;background:#1b2a4d}",
    "#wz-rows .wzr-t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:8px;font-size:14px;font-weight:700;line-height:1.25}",
    "#wz-rows .wzr-m{display:block;margin-top:3px;font-size:12.5px;line-height:1.3;color:#aeb5c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#wz-rows .wzr-m b{color:#f0c878;font-weight:700}",
    "#wz-rows .wzr-c:focus-visible,#wz-rows .wzr-all:focus-visible{outline:2px solid #f0c878;outline-offset:2px;border-radius:12px}",
    "body.wz-nocity #wz-rows{display:none !important}"
  ].join("\n");

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ymd(d) { var m = d.getMonth() + 1, j = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (j < 10 ? "0" : "") + j; }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function real(ev) { return !!(ev.photo && !ev.photoGeneric && !ev.photoVenue); }
  function timeOf(ev) { return ev.time && ev.time !== "00:00" ? ev.time : ""; }
  function sortKey(ev) { return (ev.date || "") + " " + (timeOf(ev) || "99:99"); }
  function isPlace(ev) { return ev.category === "À voir" || ev.category === "Bar"; }

  function pool() {
    var base = [];
    try { base = baseVisibleEvents(); } catch (e) { base = []; }
    var now = new Date(), today = ymd(now);
    return base.filter(function (ev) { return ev && ev.date && ev.date >= today && real(ev) && !isPlace(ev) && ev.title && (!window.__wzCatOk || window.__wzCatOk(ev, ev.category)); });
  }

  // clé anti-doublon : titre sans accents/ponctuation/numéro de séance + lieu + jour
  function dkey(e) {
    var t = String(e.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(\d+\)\s*$/, "").replace(/[^a-z0-9]+/g, "").slice(0, 45);
    var p = String(e.place || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 20);
    return t + "|" + p + "|" + (e.date || "");
  }
  function pick(def, evs, today, used) {
    var now = new Date(), end, out;
    if (def.id === "tonight") {
      out = evs.filter(function (e) { return e.date === today && timeOf(e) >= "17:00" && e.category !== "Marché"; });
    } else if (def.id === "tomorrow") {
      var dem = ymd(addDays(now, 1));
      out = evs.filter(function (e) { return e.date === dem && e.category !== "Marché"; });
    } else if (def.id === "weekend") {
      var dow = now.getDay(); // 0 = dimanche
      var sat = dow === 6 ? 0 : dow === 0 ? -1 : 6 - dow;
      var d1 = ymd(addDays(now, Math.max(sat, 0))), d2 = ymd(addDays(now, sat + 1));
      if (sat < 0) d1 = today;
      out = evs.filter(function (e) { return (e.date === d1 || e.date === d2) && e.category !== "Marché"; });
    } else {
      end = ymd(addDays(now, def.days || 21));
      out = evs.filter(function (e) { return e.date <= end && def.cats.indexOf(e.category) >= 0; });
    }
    out = out.filter(function (e) { return !used[e.id] && !used["p:" + String(e.photo || "").split("?")[0]]; }).sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : 1; });
    // une seule fois par titre (séries d'ateliers, séances répétées)
    var seen = {}, res = [];
    out.forEach(function (e) {
      var k = dkey(e), pk = "p:" + String(e.photo || "").split("?")[0];
      if (seen[k] || seen[pk]) return;            // même spectacle, ou même photo déjà dans la rangée
      seen[k] = 1; seen[pk] = 1; res.push(e);
    });
    return res.slice(0, MAX_CARDS + 25); // les 25 de plus servent de remplaçants si une photo ne charge pas
  }
  var EXTRA = {};

  function when(ev) {
    var p = String(ev.date).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(/\.$/, "");
    var t = timeOf(ev);
    return "<b>" + esc(s) + "</b>" + (t ? " · " + esc(t) : "");
  }
  function cardHTML(ev) {
    var place = ""; String(ev.place || "").split(",").some(function (p) { p = p.trim(); if (/[A-Za-zÀ-ÿ]{3,}/.test(p) && !/^\d+\s*(bis|ter)?\s+(rue|avenue|av|bd|boulevard|place|chemin|route|impasse|allée)\b/i.test(p)) { place = p; return true; } return false; });
    if (/^(lieu|aujourd.?hui|lieu à définir)$/i.test(place)) place = "";
    return '<button type="button" class="wzr-c" data-id="' + esc(ev.id) + '">' +
      '<img class="wzr-i" loading="lazy" referrerpolicy="no-referrer" alt="" src="' + esc(ev.photo) + '">' +
      '<span class="wzr-t">' + esc(ev.title) + "</span>" +
      '<span class="wzr-m">' + when(ev) + "</span>" +
      (place ? '<span class="wzr-m">' + esc(place) + "</span>" : "") + "</button>";
  }

  function goAll(def) {
    try {
      var btn = null;
      if (def.chip) btn = document.querySelector('#wz-chips [data-key="' + def.chip + '"]');
      if (!btn && def.quick) {
        var bar = document.querySelector(".home-quickbar-section");
        if (bar) [].slice.call(bar.querySelectorAll("button,a,[role=button]")).forEach(function (b) { if (!btn && (b.textContent || "").indexOf(def.quick) >= 0) btn = b; });
      }
      if (btn) btn.click();
      var t = document.getElementById("event-list-featured") || document.getElementById("event-list");
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
    } catch (e) {}
  }

  var BIG = ["paris", "lyon", "marseille", "toulouse", "nice", "nantes", "montpellier", "strasbourg", "bordeaux", "lille", "rennes", "reims", "grenoble", "dijon", "toulon", "angers", "nimes", "aix", "clermont", "tours", "rouen", "caen", "metz", "nancy", "limoges", "perpignan", "avignon", "brest"];
  function quietNote() {
    try {
      var C = CITIES, here = state.userPos ? state.userPos : C[state.city];
      if (!here || !C[state.city]) return "";
      var cur = state.userPos ? (typeof nearestCityKey === "function" ? nearestCityKey() : state.city) : state.city;
      var ranked = BIG.filter(function (k) { return C[k] && k !== cur; }).map(function (k) { return { k: k, d: haversineKm(here.lat, here.lng, C[k].lat, C[k].lng) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
      if (!ranked.length) return "";
      var chips = ranked.map(function (r) { return '<button type="button" class="wzq-chip" data-wzq="' + esc(r.k) + '">' + esc(C[r.k].name) + " · " + Math.round(r.d / 10) * 10 + " km</button>"; }).join("");
      return '<section class="wzr wzq" data-row="quiet"><div class="wzq-box"><h2>Peu de sorties à ' + esc(C[cur].name) + ' pour l’instant</h2>' +
        '<p>On en ajoute régulièrement. En attendant, voici les grandes villes les plus proches :</p><div class="wzq-chips">' + chips + "</div></div></section>";
    } catch (e) { return ""; }
  }
  var lastSig = "";
  function build() {
    try {
      if (document.body.classList.contains("wz-nocity")) return;
      var host = document.getElementById("view-discover");
      if (!host || typeof state === "undefined") return;
      var evs = pool();
      var now = new Date(), today = ymd(now);
      var sel = state.selectedPeriod || "";
      var nb = 0; try { nb = baseVisibleEvents().length; } catch (e0) {}
      var sig = state.city + "|" + (state.userPos ? "p" : "c") + "|" + evs.length + "|" + nb + "|" + today + "|" + sel;
      var wrap = document.getElementById("wz-rows");
      if (wrap && sig === lastSig) return;
      lastSig = sig;
      var used = {}, html = "", shown = [];
      // la période choisie en haut (Ce soir / Demain / Ce week-end) passe en première rangée
      var want = { "wz-tonight": "tonight", "today": "tonight", "tomorrow": "tomorrow", "wz-weekend": "weekend" }[sel] || "";
      var order = ROWS.filter(function (d) { return !d.onlySelected || d.id === want; });
      order.sort(function (x, y) { return (y.id === want ? 1 : 0) - (x.id === want ? 1 : 0); });
      order.forEach(function (def) {
        var full = pick(def, evs, today, used);
        if (full.length < MIN_CARDS) return;
        var list = full.slice(0, MAX_CARDS);
        EXTRA[def.id] = full.slice(MAX_CARDS);
        list.forEach(function (e) { used[e.id] = 1; used["p:" + String(e.photo || "").split("?")[0]] = 1; });
        shown.push(def);
        html += '<section class="wzr" data-row="' + def.id + '"><div class="wzr-h"><h2>' + esc(def.title) + '</h2><button type="button" class="wzr-all" aria-label="Tout voir : ' + esc(def.title) + '">›</button></div>' +
          '<div class="wzr-s">' + list.map(cardHTML).join("") + "</div></section>";
      });
      // petites villes : peu de vraies photos, donc peu (ou pas) de rangées. On complète avec « Prochaines sorties » (toutes photos, illustrations comprises)
      if (shown.length < 2) {
        var base = [];
        try { base = baseVisibleEvents(); } catch (e2) { base = []; }
        var lim = ymd(addDays(now, 14));
        function tier(e) { return real(e) ? 0 : (e.photoGeneric ? 3 : (e.photoVenue ? 2 : 1)); }
        var cand = base.filter(function (e) { return e && e.date && e.date >= today && e.date <= lim && e.photo && e.title && !isPlace(e) && e.category !== "Divers" && !used[e.id]; });
        cand.sort(function (x, y) { return tier(x) - tier(y) || (sortKey(x) < sortKey(y) ? -1 : 1); });
        var seen2 = {}, pick2 = [];
        cand.forEach(function (e) {
          var k = dkey(e);
          if (seen2[k] || pick2.length >= MAX_CARDS) return;
          seen2[k] = 1; pick2.push(e);
        });
        pick2.sort(function (x, y) { return sortKey(x) < sortKey(y) ? -1 : 1; });
        if (pick2.length >= MIN_CARDS) {
          html += '<section class="wzr" data-row="soon"><div class="wzr-h"><h2>Prochaines sorties</h2><button type="button" class="wzr-all" aria-label="Tout voir : Prochaines sorties">›</button></div>' +
            '<div class="wzr-s">' + pick2.map(cardHTML).join("") + "</div></section>";
        }
      }
      // très peu de sorties dans cette ville : message honnête + les grandes villes les plus proches
      // (pas quand un filtre est actif : « Musées » donne peu de résultats, mais Paris n'a pas peu de sorties)
      var filt = false;
      try { filt = !!(state.selectedPeriod || (state.selectedCategories && state.selectedCategories.size) || (typeof __searchQuery !== "undefined" && __searchQuery)); } catch (e3) {}
      if (!html && nb > 0 && !filt && !window.__wzDataLoading) html = quietNote();
      if (!wrap) {
        if (!document.getElementById("wz-rows-css")) { var st = document.createElement("style"); st.id = "wz-rows-css"; st.textContent = CSS; document.head.appendChild(st); }
        wrap = document.createElement("div"); wrap.id = "wz-rows";
        var before = host.querySelector(".home-quickbar-section");
        if (before) host.insertBefore(wrap, before); else host.appendChild(wrap);
        wrap.addEventListener("click", function (e) {
          var q = e.target.closest ? e.target.closest("[data-wzq]") : null;
          if (q) {
            try { state.city = q.getAttribute("data-wzq"); state.userPos = null; state.selectedPeriod = null; try { __hasPickedCity = true; } catch (e1) {} renderDiscover(); window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e2) {}
            return;
          }
          var c = e.target.closest ? e.target.closest(".wzr-c") : null;
          if (c) { try { openDetail(c.getAttribute("data-id")); } catch (x) {} return; }
          var a = e.target.closest ? e.target.closest(".wzr-all") : null;
          if (a) {
            var id = a.parentNode.parentNode.getAttribute("data-row");
            ROWS.forEach(function (d) { if (d.id === id) goAll(d); });
          }
        });
        // une photo qui ne charge pas : on la remplace par la sortie suivante (jamais de rangée qui fond à une seule carte) ;
        // s'il n'y a plus de remplaçant, la carte reste avec l'illustration de la sortie
        wrap.addEventListener("error", function (e) {
          var t = e.target;
          if (!(t && t.classList && t.classList.contains("wzr-i"))) return;
          var c = t.closest(".wzr-c"); if (!c) return;
          var row = c.closest(".wzr"), strip = c.parentNode, id = row ? row.getAttribute("data-row") : "";
          var ex = EXTRA[id];
          if (ex && ex.length) { var nx = ex.shift(); c.insertAdjacentHTML("afterend", cardHTML(nx)); c.remove(); return; }
          // plus de remplaçant : s'il reste assez d'autres cartes, on retire celle-ci (pas d'illustration répétée) ;
          // sinon elle reste avec l'illustration de la sortie (une rangée ne disparaît jamais à cause de photos lentes)
          if (strip.querySelectorAll(".wzr-c").length > MIN_CARDS) { c.remove(); return; }
          try {
            var ev = allEvents().filter(function (x) { return x.id === c.getAttribute("data-id"); })[0] || {};
            var box = document.createElement("div"); box.className = "wzr-i";
            box.innerHTML = typeof window.sceneSVG === "function" ? window.sceneSVG(ev.scene) : "";
            t.replaceWith(box);
          } catch (x) {}
        }, true);
      }
      wrap.innerHTML = html;
    } catch (e) { console.error("Rangées d'accueil", e); }
  }

  var timer = null;
  function later() { clearTimeout(timer); timer = setTimeout(build, 250); }

  function install() {
    try {
      if (typeof renderDiscover !== "function") return;
      var orig = renderDiscover;
      renderDiscover = function () { var r = orig.apply(this, arguments); later(); return r; };
    } catch (e) {}
    build();
    // les données arrivent ville par ville : on revérifie quelques fois au démarrage
    var n = 0, iv = setInterval(function () { build(); if (++n > 12) clearInterval(iv); }, 1000);
  }
  function boot() {
    try { if (typeof CITIES === "undefined" || typeof state === "undefined" || typeof renderDiscover !== "function" || typeof baseVisibleEvents !== "function") return setTimeout(boot, 250); } catch (e) { return setTimeout(boot, 250); }
    setTimeout(install, 700);
  }
  if (document.readyState === "complete") setTimeout(boot, 100);
  else window.addEventListener("load", function () { setTimeout(boot, 100); });
})();
