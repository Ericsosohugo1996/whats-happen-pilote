// ---- Accueil en rangées glissantes, avec de grandes photos (comme Airbnb) ----
// Ajoute sous les raccourcis des rangées : Ce soir, Ce week-end, Concerts, Spectacles, Expos, En famille.
// Seuls les événements qui ont une vraie photo y figurent ; la liste complète reste juste en dessous.
// Pour tout annuler : retirer la ligne <script src="home-rows.js"> dans index.html.
(function () {
  "use strict";

  var ROWS = [
    { id: "tonight", title: "Ce soir", chip: "wz-tonight" },
    { id: "weekend", title: "Ce week-end", chip: "wz-weekend" },
    { id: "music", title: "Concerts et musique", cats: ["Musique", "Musique classique"], days: 21, quick: "Musique" },
    { id: "show", title: "Spectacles", cats: ["Spectacles"], days: 21, quick: "Spectacles" },
    { id: "expo", title: "Expos à voir", cats: ["Expo"], days: 30 },
    { id: "family", title: "En famille", cats: ["Famille"], days: 21 }
  ];
  var MIN_CARDS = 3, MAX_CARDS = 10;

  var CSS = [
    "html body.wz-v2 #view-discover > #wz-rows{order:4;margin:4px 0 10px}",
    "#wz-rows .wzr{margin:0 0 18px}",
    "#wz-rows .wzr-h{display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin:0 0 10px}",
    "html body #view-discover #wz-rows .wzr-h h2{margin:0;font-family:Fraunces,Georgia,serif;font-size:19px;font-weight:600;color:#fff !important;opacity:1 !important;padding:0 !important;text-align:left}",
    "#wz-rows .wzr-all{border:0;background:rgba(255,255,255,.1);color:#fff;width:32px;height:32px;border-radius:50%;font-size:17px;cursor:pointer;font-family:inherit}",
    "#wz-rows .wzr-s{display:flex;align-items:flex-start;gap:12px;overflow-x:auto;padding:0 16px 4px;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch}",
    "#wz-rows .wzr-s::-webkit-scrollbar{display:none}",
    "#wz-rows .wzr-c{flex:0 0 156px;display:block;scroll-snap-align:start;border:0;background:none;padding:0;text-align:left;color:#fff;cursor:pointer;font-family:inherit}",
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
    return base.filter(function (ev) { return ev && ev.date && ev.date >= today && real(ev) && !isPlace(ev) && ev.title; });
  }

  function pick(def, evs, today, used) {
    var now = new Date(), end, out;
    if (def.id === "tonight") {
      out = evs.filter(function (e) { return e.date === today && timeOf(e) >= "17:00" && e.category !== "Marché"; });
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
    out = out.filter(function (e) { return !used[e.id]; }).sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : 1; });
    // une seule fois par titre (séries d'ateliers, séances répétées)
    var seen = {}, res = [];
    out.forEach(function (e) {
      var k = String(e.title).toLowerCase().replace(/\s*\(\d+\)\s*$/, "").slice(0, 40);
      if (seen[k]) return;
      seen[k] = 1; res.push(e);
    });
    return res.slice(0, MAX_CARDS);
  }

  function when(ev) {
    var p = String(ev.date).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(/\.$/, "");
    var t = timeOf(ev);
    return "<b>" + esc(s) + "</b>" + (t ? " · " + esc(t) : "");
  }
  function cardHTML(ev) {
    var place = String(ev.place || "").split(",")[0].trim();
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

  var lastSig = "";
  function build() {
    try {
      if (document.body.classList.contains("wz-nocity")) return;
      var host = document.getElementById("view-discover");
      if (!host || typeof state === "undefined") return;
      var evs = pool();
      var now = new Date(), today = ymd(now);
      var sig = state.city + "|" + (state.userPos ? "p" : "c") + "|" + evs.length + "|" + today;
      var wrap = document.getElementById("wz-rows");
      if (wrap && sig === lastSig) return;
      lastSig = sig;
      var used = {}, html = "", shown = [];
      ROWS.forEach(function (def) {
        var list = pick(def, evs, today, used);
        if (list.length < MIN_CARDS) return;
        list.forEach(function (e) { used[e.id] = 1; });
        shown.push(def);
        html += '<section class="wzr" data-row="' + def.id + '"><div class="wzr-h"><h2>' + esc(def.title) + '</h2><button type="button" class="wzr-all" aria-label="Tout voir : ' + esc(def.title) + '">›</button></div>' +
          '<div class="wzr-s">' + list.map(cardHTML).join("") + "</div></section>";
      });
      if (!wrap) {
        if (!document.getElementById("wz-rows-css")) { var st = document.createElement("style"); st.id = "wz-rows-css"; st.textContent = CSS; document.head.appendChild(st); }
        wrap = document.createElement("div"); wrap.id = "wz-rows";
        var before = host.querySelector(".home-quickbar-section");
        if (before) host.insertBefore(wrap, before); else host.appendChild(wrap);
        wrap.addEventListener("click", function (e) {
          var c = e.target.closest ? e.target.closest(".wzr-c") : null;
          if (c) { try { openDetail(c.getAttribute("data-id")); } catch (x) {} return; }
          var a = e.target.closest ? e.target.closest(".wzr-all") : null;
          if (a) {
            var id = a.parentNode.parentNode.getAttribute("data-row");
            ROWS.forEach(function (d) { if (d.id === id) goAll(d); });
          }
        });
        // une photo qui ne charge pas : on retire la carte plutôt que d'afficher un trou
        wrap.addEventListener("error", function (e) {
          var t = e.target;
          if (t && t.classList && t.classList.contains("wzr-i")) { var c = t.closest(".wzr-c"); if (c) c.remove(); }
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
