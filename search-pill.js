// ---- Barre de recherche unique « Où ? Quand ? » (comme Airbnb) ----
// Une barre en haut de l'accueil. On la touche : un écran simple propose la ville (À proximité + villes),
// le moment (Aujourd'hui, Ce soir, Demain, Ce week-end) et le type de sortie. Un seul bouton : « Voir les sorties ».
// Pour tout annuler : retirer la ligne <script src="search-pill.js"> dans index.html.
(function () {
  "use strict";

  var POP = ["paris", "lyon", "marseille", "bordeaux", "lille", "toulouse", "nantes", "nice", "strasbourg", "montpellier", "rennes", "grenoble"];
  var WHEN = [
    { key: null, label: "Quand tu veux" },
    { key: "today", label: "Aujourd'hui" },
    { key: "wz-tonight", label: "Ce soir" },
    { key: "tomorrow", label: "Demain" },
    { key: "wz-weekend", label: "Ce week-end" }
  ];
  var WHAT = [
    { id: "all", label: "Tout", cats: [] },
    { id: "music", label: "🎵 Concerts", cats: ["Musique", "Musique classique"] },
    { id: "night", label: "🎟️ Soirées", cats: ["Soirée"] },
    { id: "show", label: "🎭 Spectacles", cats: ["Spectacles"] },
    { id: "expo", label: "🖼️ Expos", cats: ["Expo"] },
    { id: "family", label: "👨‍👩‍👧 En famille", cats: ["Famille"] },
    { id: "sport", label: "⚽ Sport", cats: ["Sport"] },
    { id: "market", label: "🛍️ Marchés", cats: ["Marché", "Brocante"] },
    { id: "fest", label: "🎪 Festivals", cats: ["Festival"] }
  ];

  var CSS = [
    "html body.wz-v2 #view-discover > #wz-searchbar{order:0;display:flex;align-items:center;gap:12px;margin:10px 16px 6px;padding:13px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;font-family:inherit;text-align:left;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.28);width:calc(100% - 32px)}",
    "#wz-searchbar .sp-i{font-size:20px}",
    "#wz-searchbar .sp-t{display:flex;flex-direction:column;min-width:0}",
    "#wz-searchbar .sp-a{font-size:15.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#wz-searchbar .sp-b{font-size:12.5px;color:#c3c8d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "body.wz-nocity #wz-searchbar{display:none !important}",
    "#wz-sheet{position:fixed;inset:0;z-index:9600;background:linear-gradient(180deg,#14213f 0%,#0b1526 100%);color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column}",
    "#wz-sheet *{box-sizing:border-box}",
    "#wz-sheet .sh-top{display:flex;align-items:center;justify-content:space-between;padding:max(env(safe-area-inset-top),14px) 18px 6px}",
    "#wz-sheet .sh-top h2{margin:0;font-family:Fraunces,Georgia,serif;font-size:24px}",
    "#wz-sheet .sh-x{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer}",
    "#wz-sheet .sh-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 18px 24px;display:flex;flex-direction:column;gap:14px}",
    "#wz-sheet .card{background:rgba(255,255,255,.07);border-radius:20px;padding:16px}",
    "#wz-sheet .card h3{margin:0 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#f0c878}",
    "#wz-sheet input[type=search]{width:100%;border:1.5px solid #3a4560;background:#0f1a33;color:#fff;border-radius:14px;padding:13px 14px;font-size:16px;font-family:inherit;margin-bottom:10px}",
    "#wz-sheet .rows{display:flex;flex-direction:column;gap:6px}",
    "#wz-sheet .row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1.5px solid transparent;background:rgba(255,255,255,.05);color:#fff;border-radius:14px;padding:12px 14px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}",
    "#wz-sheet .row small{display:block;font-size:12.5px;font-weight:500;color:#aeb5c8;margin-top:2px}",
    "#wz-sheet .row.on{border-color:#f0c878;background:rgba(240,200,120,.12)}",
    "#wz-sheet .chips{display:flex;flex-wrap:wrap;gap:8px}",
    "#wz-sheet .chip{border-radius:999px;padding:11px 16px;border:1.5px solid #3a4560;background:transparent;color:#dfe3ee;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}",
    "#wz-sheet .chip.on{border-color:transparent;background:linear-gradient(90deg,#f0c878,#e85d3d);color:#1a1030;font-weight:800}",
    "#wz-sheet .sh-foot{display:flex;gap:12px;align-items:center;padding:12px 18px max(env(safe-area-inset-bottom),14px);border-top:1px solid rgba(255,255,255,.1);background:#0b1526}",
    "#wz-sheet .go{flex:1;border:0;border-radius:16px;padding:16px;background:linear-gradient(90deg,#f0c878,#e85d3d);color:#1a1030;font-size:17px;font-weight:800;cursor:pointer;font-family:inherit}",
    "#wz-sheet .clr{border:0;background:none;color:#c3c8d6;font-size:15px;font-weight:700;text-decoration:underline;cursor:pointer;font-family:inherit;padding:8px}",
    "#wz-sheet .err{color:#ffb4a2;font-size:13.5px;margin-top:6px}",
    "#wz-sheet button:focus-visible,#wz-sheet input:focus-visible,#wz-searchbar:focus-visible{outline:2px solid #f0c878;outline-offset:2px}"
  ].join("\n");

  var sel = { city: null, near: false, when: null, what: "all", q: "", err: "" };
  var sheet = null;

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function cities() { try { return CITIES; } catch (e) { return {}; } }
  function cname(k) { var c = cities()[k]; return c ? c.name : k; }
  function whatOf(id) { for (var i = 0; i < WHAT.length; i++) if (WHAT[i].id === id) return WHAT[i]; return WHAT[0]; }
  function whenLabel(k) { for (var i = 0; i < WHEN.length; i++) if (WHEN[i].key === k) return WHEN[i].label; return ""; }

  // ---- ce que l'appli affiche actuellement ----
  function currentWhat() {
    try {
      var s = state.selectedCategories;
      if (!s || !s.size) return "all";
      for (var i = 0; i < WHAT.length; i++) {
        var c = WHAT[i].cats;
        if (c.length && c.length === s.size && c.every(function (x) { return s.has(x); })) return WHAT[i].id;
      }
    } catch (e) {}
    return "all";
  }
  function summary() {
    var where = "Où ?";
    try { where = state.userPos ? "Autour de moi" : cname(state.city); } catch (e) {}
    var w = ""; try { w = state.selectedPeriod ? whenLabel(state.selectedPeriod) : ""; } catch (e) {}
    var k = currentWhat();
    var parts = [];
    parts.push(w || "Quand tu veux");
    parts.push(k === "all" ? "Toutes les sorties" : whatOf(k).label.replace(/^[^\wÀ-ÿ]+\s*/, ""));
    return { a: where, b: parts.join(" · ") };
  }

  // ---- la barre ----
  function ensureBar() {
    var host = document.getElementById("view-discover");
    if (!host) return;
    var bar = document.getElementById("wz-searchbar");
    if (!bar) {
      if (!document.getElementById("wz-sheet-css")) { var st = document.createElement("style"); st.id = "wz-sheet-css"; st.textContent = CSS; document.head.appendChild(st); }
      bar = document.createElement("button");
      bar.type = "button"; bar.id = "wz-searchbar";
      bar.setAttribute("aria-label", "Chercher une sortie : où, quand, quoi");
      bar.addEventListener("click", openSheet);
      host.insertBefore(bar, host.firstChild);
    }
    var s = summary();
    bar.innerHTML = '<span class="sp-i" aria-hidden="true">🔍</span><span class="sp-t"><span class="sp-a">' + esc(s.a) + '</span><span class="sp-b">' + esc(s.b) + "</span></span>";
  }

  // ---- l'écran de recherche ----
  function cityRows() {
    var C = cities(), q = fold(sel.q).trim(), keys;
    if (q.length >= 2) {
      keys = Object.keys(C).filter(function (k) { return fold(C[k].name).indexOf(q) >= 0; })
        .sort(function (a, b) { var sa = fold(C[a].name).indexOf(q) === 0 ? 0 : 1, sb = fold(C[b].name).indexOf(q) === 0 ? 0 : 1; return sa - sb || C[a].name.localeCompare(C[b].name, "fr"); }).slice(0, 8);
    } else keys = POP.filter(function (k) { return C[k]; }).slice(0, 6);
    var h = '<button type="button" class="row' + (sel.near ? " on" : "") + '" data-near="1"><span aria-hidden="true">📍</span><span>À proximité<small>Les sorties autour de moi</small></span></button>';
    h += keys.map(function (k) { return '<button type="button" class="row' + (!sel.near && sel.city === k ? " on" : "") + '" data-city="' + esc(k) + '"><span aria-hidden="true">🏙️</span><span>' + esc(C[k].name) + "</span></button>"; }).join("");
    if (q.length >= 2 && !keys.length) h += '<div class="err">Aucune ville de ce nom pour l’instant.</div>';
    return h;
  }
  function render() {
    if (!sheet) return;
    var keepQ = sheet.querySelector("#sh-q"), pos = sheet.querySelector(".sh-body") ? sheet.querySelector(".sh-body").scrollTop : 0;
    sheet.innerHTML =
      '<div class="sh-top"><h2>Où sors-tu ?</h2><button type="button" class="sh-x" data-act="close" aria-label="Fermer">✕</button></div>' +
      '<div class="sh-body">' +
      '<div class="card"><h3>Où ?</h3><input type="search" id="sh-q" placeholder="Chercher une ville…" value="' + esc(sel.q) + '" autocomplete="off" aria-label="Chercher une ville"><div class="rows" id="sh-rows">' + cityRows() + "</div>" + (sel.err ? '<div class="err" role="alert">' + esc(sel.err) + "</div>" : "") + "</div>" +
      '<div class="card"><h3>Quand ?</h3><div class="chips">' + WHEN.map(function (w) { return '<button type="button" class="chip' + (sel.when === w.key ? " on" : "") + '" data-when="' + esc(w.key || "") + '">' + esc(w.label) + "</button>"; }).join("") + "</div></div>" +
      '<div class="card"><h3>Quoi ?</h3><div class="chips">' + WHAT.map(function (w) { return '<button type="button" class="chip' + (sel.what === w.id ? " on" : "") + '" data-what="' + w.id + '">' + esc(w.label) + "</button>"; }).join("") + "</div></div>" +
      "</div>" +
      '<div class="sh-foot"><button type="button" class="clr" data-act="clear">Tout effacer</button><button type="button" class="go" data-act="go">Voir les sorties</button></div>';
    var b = sheet.querySelector(".sh-body"); if (b) b.scrollTop = pos;
    var q = sheet.querySelector("#sh-q");
    if (q && keepQ && document.activeElement === keepQ) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} }
  }
  function openSheet() {
    try {
      if (sheet) return;
      sel.near = !!state.userPos; sel.city = state.city; sel.when = state.selectedPeriod || null; sel.what = currentWhat(); sel.q = ""; sel.err = "";
      sheet = document.createElement("div");
      sheet.id = "wz-sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Chercher une sortie");
      document.body.appendChild(sheet);
      sheet.addEventListener("click", onClick);
      sheet.addEventListener("input", function (e) {
        if (e.target && e.target.id === "sh-q") { sel.q = e.target.value; var r = sheet.querySelector("#sh-rows"); if (r) r.innerHTML = cityRows(); }
      });
      document.addEventListener("keydown", onKey);
      render();
      var x = sheet.querySelector(".sh-x"); if (x) x.focus();
    } catch (e) { console.error("Recherche", e); }
  }
  function closeSheet() {
    if (sheet) { sheet.remove(); sheet = null; }
    document.removeEventListener("keydown", onKey);
    var b = document.getElementById("wz-searchbar"); if (b) b.focus();
  }
  function onKey(e) { if (e.key === "Escape") closeSheet(); }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest("button") : null;
    if (!t || !sheet || !sheet.contains(t)) return;
    var act = t.getAttribute("data-act");
    if (act === "close") return closeSheet();
    if (act === "clear") { sel.city = sel.near ? null : sel.city; sel.when = null; sel.what = "all"; sel.q = ""; sel.err = ""; return render(); }
    if (act === "go") return apply();
    if (t.hasAttribute("data-near")) { sel.near = true; sel.err = ""; return render(); }
    if (t.hasAttribute("data-city")) { sel.near = false; sel.city = t.getAttribute("data-city"); sel.err = ""; return render(); }
    if (t.hasAttribute("data-when")) { sel.when = t.getAttribute("data-when") || null; return render(); }
    if (t.hasAttribute("data-what")) { sel.what = t.getAttribute("data-what"); return render(); }
  }

  // ---- on applique les choix avec les mêmes réglages que le reste de l'appli ----
  function finish(userPos, cityKey) {
    try {
      state.userPos = userPos;
      if (cityKey) state.city = cityKey;
      state.selectedPeriod = sel.when || null;
      state.selectedCategories = new Set(whatOf(sel.what).cats);
      state.selectedArrondissement = null;
      state.radiusKm = 20;
      try { __hasPickedCity = true; } catch (e) {}
      try { __hasPickedFilter = true; } catch (e) {}
      renderDiscover();
      try { if (typeof renderCategoryChips === "function") renderCategoryChips(); } catch (e) {}
    } catch (e) { console.error("Recherche : application impossible", e); }
    closeSheet();
    setTimeout(function () {
      try {
        var t = document.getElementById("event-list-featured") || document.getElementById("event-list");
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); else window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {}
    }, 150);
  }
  function apply() {
    if (sel.near) {
      if (!navigator.geolocation) { sel.err = "La position n’est pas disponible ici : choisis une ville."; return render(); }
      var go = sheet && sheet.querySelector(".go"); if (go) { go.disabled = true; go.textContent = "Recherche de ta position…"; }
      navigator.geolocation.getCurrentPosition(function (p) {
        var pos = { lat: p.coords.latitude, lng: p.coords.longitude }, key = null;
        try { state.userPos = pos; if (typeof nearestCityKey === "function") key = nearestCityKey(); } catch (e) {}
        finish(pos, key);
      }, function () { sel.err = "Position refusée : choisis une ville dans la liste."; sel.near = false; render(); }, { timeout: 8000, maximumAge: 300000 });
      return;
    }
    if (!sel.city) { sel.err = "Choisis d’abord une ville, ou « À proximité »."; return render(); }
    finish(null, sel.city);
  }

  // ---- mise à jour de la barre quand l'appli se redessine ----
  var timer = null;
  function later() { clearTimeout(timer); timer = setTimeout(ensureBar, 200); }
  function install() {
    try {
      if (typeof renderDiscover !== "function") return;
      var orig = renderDiscover;
      renderDiscover = function () { var r = orig.apply(this, arguments); later(); return r; };
    } catch (e) {}
    ensureBar();
    var n = 0, iv = setInterval(function () { ensureBar(); if (++n > 10) clearInterval(iv); }, 1000);
  }
  function boot() {
    try { if (typeof CITIES === "undefined" || typeof state === "undefined" || typeof renderDiscover !== "function") return setTimeout(boot, 250); } catch (e) { return setTimeout(boot, 250); }
    setTimeout(install, 800);
  }
  if (document.readyState === "complete") setTimeout(boot, 100);
  else window.addEventListener("load", function () { setTimeout(boot, 100); });
})();
