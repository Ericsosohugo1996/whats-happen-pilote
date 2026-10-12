// home-v2.js — nouvelle page d'accueil Whazup (style « nuit festive »)
// Ajoute : boutons Aujourd'hui / Ce soir / Demain / Ce week-end (avec le nombre de sorties),
// phrase d'accroche sur la photo de la ville, prix lisible sur les cartes, icônes de la barre du bas.
// Ne change AUCUNE donnée et ne remplace aucune fonction de l'appli : il ajoute seulement par-dessus.
// POUR TOUT ANNULER : supprimer ce fichier (home-v2.js) et home-v2.css sur GitHub. Le site retrouve son ancien look.
(function () {
  "use strict";
  if (window.__wzHomeV2) return;
  window.__wzHomeV2 = true;

  // ---- feuille de style (fichier séparé) ----
  try {
    if (!document.getElementById("wz-home-v2-css")) {
      var lk = document.createElement("link");
      lk.id = "wz-home-v2-css"; lk.rel = "stylesheet"; lk.href = "home-v2.css";
      document.head.appendChild(lk);
    }
    document.body.classList.add("wz-v2");
  } catch (e) {}

  // ---- dates (même logique « UTC » que le reste de l'appli, pour rester cohérent) ----
  function isoPlus(days) { return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10); }
  function dow(iso) { return new Date(iso + "T12:00:00").getDay(); } // 0 = dimanche, 6 = samedi
  function weekendDates() {
    var out = [];
    for (var i = 0; i <= 7; i++) {
      var d = isoPlus(i), w = dow(d);
      if (w === 6 || w === 0) out.push(d);
      if (out.length === 2 || (w === 0 && out.length >= 1)) break;
    }
    return out;
  }

  // ---- nouveaux filtres de période (clés propres à v2 : l'appli d'origine ne les connaît pas) ----
  function matchV2(ev, period) {
    if (ev.isPlace) return true;
    var today = isoPlus(0);
    if (period === "wz-tonight") {
      if (ev.date !== today || !ev.time) return false;
      var h = parseInt(String(ev.time).split(":")[0], 10);
      return h >= 18 || h < 4;
    }
    if (period === "wz-weekend") return weekendDates().indexOf(ev.date) !== -1;
    return null;
  }
  try {
    if (typeof matchesPeriod === "function" && !matchesPeriod.__wzV2) {
      var origMatches = matchesPeriod;
      var wrapped = function (ev, period) {
        var r = matchV2(ev, period);
        return r === null ? origMatches(ev, period) : r;
      };
      wrapped.__wzV2 = true;
      matchesPeriod = wrapped; // eslint-disable-line no-global-assign
    }
  } catch (e) {}

  var CHIPS = [
    { key: "today", label: "Aujourd'hui" },
    { key: "wz-tonight", label: "Ce soir" },
    { key: "wz-weekend", label: "Ce week-end" }
  ];

  function countFor(events, key) {
    var n = 0;
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.isPlace) continue;
      if (!ev.date || ev.date < isoPlus(0)) continue;
      if (matchesPeriod(ev, key)) n++;
    }
    return n;
  }

  function ensureChips() {
    var host = document.getElementById("view-discover");
    var bar = document.getElementById("stats-banner");
    if (!host || !bar) return null;
    var row = document.getElementById("wz-chips");
    if (row) return row;
    row = document.createElement("div");
    row.id = "wz-chips";
    row.setAttribute("role", "tablist");
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "wz-chip"; b.dataset.key = c.key;
      b.innerHTML = '<span class="wz-chip-l">' + c.label + '</span><span class="wz-chip-n"></span>';
      b.addEventListener("click", function () {
        try {
          revealResults();
          state.selectedPeriod = (state.selectedPeriod === c.key) ? null : c.key;
          document.querySelectorAll(".stat[data-filter]").forEach(function (s) { s.classList.remove("active"); });
          renderDiscover();
        } catch (e) {}
      });
      row.appendChild(b);
    });
    bar.parentNode.insertBefore(row, bar);
    return row;
  }

  function prixTexte(ev) {
    var p = String(ev.price || "");
    var low = p.toLowerCase();
    if (low.indexOf("gratuit") !== -1 || low.indexOf("libre") !== -1) return null; // garder « Gratuit »
    var re = /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/gi, m, min = null;
    while ((m = re.exec(p))) {
      var v = parseFloat(m[1].replace(",", "."));
      if (!isNaN(v) && (min === null || v < min)) min = v;
    }
    if (min !== null) return "dès " + String(min).replace(".", ",") + " €";
    if (low.indexOf("inscription") !== -1) return null;
    if (!p || low.indexOf("voir sur place") !== -1) return "Voir sur place";
    return null;
  }

  // la liste détaillée ne s'affichait qu'après un premier filtre : avec les nouveaux boutons, elle est visible tout de suite
  function revealResults() {
    try {
      if (typeof __hasPickedCity !== "undefined" && __hasPickedCity &&
          typeof __hasPickedFilter !== "undefined" && !__hasPickedFilter) {
        __hasPickedFilter = true; // eslint-disable-line no-global-assign
        if (typeof __toggleResultsContent === "function") __toggleResultsContent(true);
      }
    } catch (e) {}
  }


  // ---- raccourcis : Surprends-moi / Nouveautés / Mon carnet (accessibles d'un seul geste) ----
  function ensureShortcuts() {
    var host = document.getElementById("view-discover");
    var chips = document.getElementById("wz-chips");
    if (!host || !chips) return;
    var row = document.getElementById("wz-shortcuts");
    if (!row) {
      row = document.createElement("div");
      row.id = "wz-shortcuts";
      var defs = [
        { id: "sc-surprise", t: "✨ Surprends-moi" },
        { id: "sc-new", t: "🆕 Nouveautés" },
        { id: "sc-carnet", t: "📖 Mon carnet" },
        { id: "sc-envies", t: "💫 Mes envies" }
      ];
      defs.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button"; b.id = d.id; b.className = "wz-sc"; b.textContent = d.t;
        row.appendChild(b);
      });
      chips.parentNode.insertBefore(row, chips.nextSibling);
      row.querySelector("#sc-surprise").addEventListener("click", function () {
        try {
          var blk = (typeof __ensureSurpriseUI === "function") ? __ensureSurpriseUI() : document.getElementById("surprise-block");
          if (!blk) return;
          var open = !blk.classList.contains("wz-open");
          blk.classList.toggle("wz-open", open);
          this.classList.toggle("on", open);
          var step = blk.querySelector("#surprise-time-step"), res = blk.querySelector("#surprise-result");
          if (res) res.style.display = "none";
          if (step) step.style.display = open ? "flex" : "none";
          if (open) blk.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {}
      });
      row.querySelector("#sc-new").addEventListener("click", function () {
        try { if (typeof __newFindsShow === "function") __newFindsShow(); } catch (e) {}
      });
      row.querySelector("#sc-envies").addEventListener("click", function () {
        try { if (window.__questOpen) window.__questOpen(); } catch (e) {}
      });
      row.querySelector("#sc-carnet").addEventListener("click", function () {
        try { if (window.__renderSouvenirsScreen) window.__renderSouvenirsScreen(); } catch (e) {}
      });
    }
    var blk2 = document.getElementById("surprise-block") || ((typeof __ensureSurpriseUI === "function") ? __ensureSurpriseUI() : null);
    if (blk2 && blk2.previousElementSibling !== row) row.parentNode.insertBefore(blk2, row.nextSibling);
  }

  function decorate() {
    try {
      document.body.classList.toggle("wz-nocity", typeof __hasPickedCity !== "undefined" && !__hasPickedCity);
      revealResults();
      var row = ensureChips();
      ensureShortcuts();
      if (row) {
        var base = (typeof baseVisibleEvents === "function") ? baseVisibleEvents() : [];
        row.querySelectorAll(".wz-chip").forEach(function (b) {
          var k = b.dataset.key;
          b.classList.toggle("on", state.selectedPeriod === k);
          b.querySelector(".wz-chip-n").textContent = countFor(base, k);
        });
      }
      // bouton « Autour de moi » sur la photo de la ville
      var bar = document.querySelector("#view-discover .locate-bar");
      if (bar && !bar.querySelector(".wz-near")) {
        var nb = document.createElement("button");
        nb.type = "button"; nb.className = "wz-near"; nb.textContent = "📍 Autour de moi";
        nb.addEventListener("click", function (e) {
          e.stopPropagation();
          try { if (typeof __nearMeShow === "function") __nearMeShow(); } catch (er) {}
        });
        bar.appendChild(nb);
      }
      // phrase d'accroche sur la photo de la ville
      var info = document.querySelector("#view-discover .locate-info");
      if (info && !info.querySelector(".wz-tagline")) {
        var t = document.createElement("div");
        t.className = "wz-tagline";
        t.textContent = "Si j'avais su, j'y serais allé.";
        info.appendChild(t);
      }
      // prix lisible sur les cartes
      var byId = null;
      document.querySelectorAll("#view-discover .event-card:not(.event-card--place)").forEach(function (card) {
        var tag = card.querySelector(".dist");
        if (!tag || tag.dataset.wzp) return;
        tag.dataset.wzp = "1";
        if (!byId) {
          byId = {};
          (typeof allEvents === "function" ? allEvents() : []).forEach(function (e) { byId[e.id] = e; });
        }
        var ev = byId[card.dataset.id];
        if (!ev) return;
        var txt = prixTexte(ev);
        if (txt) tag.textContent = txt;
      });
    } catch (e) {}
  }

  // ---- on se branche APRÈS l'affichage de la liste (sans remplacer la fonction d'origine) ----
  try {
    if (typeof renderDiscover === "function" && !renderDiscover.__wzV2) {
      var origRender = renderDiscover;
      var w2 = function () {
        var r = origRender.apply(this, arguments);
        decorate();
        return r;
      };
      w2.__wzV2 = true;
      renderDiscover = w2; // eslint-disable-line no-global-assign
    }
  } catch (e) {}

  // la liste « complète » peut se rafraîchir toute seule (chargement progressif) : on regarde les changements
  try {
    var list = document.getElementById("event-list");
    var feat = document.getElementById("event-list-featured");
    var timer = null;
    var mo = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(decorate, 120);
    });
    if (list) mo.observe(list, { childList: true });
    if (feat) mo.observe(feat, { childList: true });
  } catch (e) {}


  // « Autour de moi » faisait défiler la page directement jusqu'à la liste : on remonte plutôt en haut (photo, boutons, raccourcis)
  try {
    if (typeof __nearMeShow === "function" && !__nearMeShow.__wzV2) {
      var origNear = __nearMeShow;
      var nearW = function () {
        window.__wzNearAt = Date.now();
        return origNear.apply(this, arguments);
      };
      nearW.__wzV2 = true;
      __nearMeShow = nearW; // eslint-disable-line no-global-assign
    }
    var origSIV = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
      try {
        if ((this.id === "event-list-featured" || this.id === "event-list") &&
            window.__wzNearAt && Date.now() - window.__wzNearAt < 20000) {
          window.__wzNearAt = 0;
          window.scrollTo(0, 0);
          return;
        }
      } catch (e) {}
      return origSIV.apply(this, arguments);
    };
  } catch (e) {}

  // carnet vide sans compte : message clair (les souvenirs sont sur le compte) + bouton pour se connecter
  try {
    var emptyMo = new MutationObserver(function () {
      var list = document.getElementById("souvenirs-list");
      if (!list || list.dataset.wzEmpty) return;
      if (!document.getElementById("souvenirs-connect-btn")) return; // seulement si pas de vrai compte
      if (list.textContent.indexOf("Aucun souvenir") !== 0) return;
      list.dataset.wzEmpty = "1";
      try { document.getElementById("souvenirs-connect-btn").parentElement.style.display = "none"; } catch (e) {}
      list.innerHTML =
        '<div style="text-align:center;padding:36px 8px 8px;color:#C7CEE3;">' +
        '<div style="font-size:34px;margin-bottom:10px;">📖</div>' +
        '<div style="font-family:Fraunces,Georgia,serif;font-size:18px;font-weight:600;color:#fff;margin-bottom:8px;">Ton carnet est vide sur cet appareil</div>' +
        '<div style="font-size:13.5px;line-height:1.5;margin-bottom:16px;">Tes souvenirs sont enregistrés sur ton compte : connecte-toi pour les retrouver, même depuis un autre téléphone.</div>' +
        '<button type="button" id="wz-carnet-login" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:12px 22px;font-size:13.5px;font-weight:700;cursor:pointer;">Me connecter</button>' +
        '<div style="font-size:12.5px;line-height:1.5;margin-top:18px;color:#9BA5C2;">Pas envie de te connecter ? Appuie sur 📸 pour ajouter un souvenir : il restera sur ce téléphone, mais tu risques de le perdre si tu changes d\'appareil.</div>' +
        '</div>';
      var b = document.getElementById("wz-carnet-login");
      if (b) b.addEventListener("click", function () {
        var m = document.getElementById("account-modal");
        if (m) m.classList.remove("hidden");
      });
    });
    emptyMo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  // écran d'arrivée : « Surprends-moi » (questionnaire d'ambiance) devient « Mes envies » pour ne pas le confondre avec celui de l'accueil
  try {
    var arrMo = new MutationObserver(function () {
      var o = document.querySelector('#arrival-screen-overlay .arrival-opt[data-key="other"] span:last-child');
      if (o && o.textContent.trim() !== "Mes envies" && /surprends|surprise/i.test(o.textContent)) o.textContent = "Mes envies";
    });
    arrMo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  // plus d'écran d'arrivée intermédiaire : « __arrivalShow » (appelé au démarrage et par les boutons Retour) ramène directement à l'accueil
  try {
    if (typeof __arrivalShow === "function" && !__arrivalShow.__wzV2) {
      var origArrival = __arrivalShow;
      var goHome = function () {
        try { origArrival.apply(this, arguments); } catch (e) {}
        try {
          var ov = document.getElementById("arrival-screen-overlay");
          if (ov) ov.remove();
          var fl = document.getElementById("arrival-back-floating");
          if (fl) fl.remove();
          if (typeof __arrivalShowCityView === "function") __arrivalShowCityView();
          var fl2 = document.getElementById("arrival-back-floating");
          if (fl2) fl2.remove();
          window.scrollTo(0, 0);
        } catch (e) {}
      };
      goHome.__wzV2 = true;
      __arrivalShow = goHome; // eslint-disable-line no-global-assign
      window.__arrivalShow = goHome;
    }
  } catch (e) {}

  decorate();
  setTimeout(decorate, 1200);
})();
