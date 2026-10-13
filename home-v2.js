// home-v2.js — nouvelle page d'accueil Whazup (style « nuit festive »)
// Ajoute : boutons Aujourd'hui / Ce soir / Demain / Ce week-end (avec le nombre de sorties),
// phrase d'accroche sur la photo de la ville, prix lisible sur les cartes, icônes de la barre du bas.
// Ne change AUCUNE donnée et ne remplace aucune fonction de l'appli : il ajoute seulement par-dessus.
// POUR TOUT ANNULER : supprimer ce fichier (home-v2.js) et home-v2.css sur GitHub. Le site retrouve son ancien look.
(function () {
  "use strict";
  if (window.__wzHomeV2) return;
  window.__wzHomeV2 = true;


  // ---- mesure des visites (Cloudflare Web Analytics : sans cookies, sans suivi individuel) ----
  // POUR ARRÊTER LA MESURE : supprimer ce bloc, ou supprimer home-v2.js.
  try {
    var h = location.hostname;
    if ((h === "whazup.fr" || h === "www.whazup.fr") && !document.getElementById("wz-cf-beacon")) {
      var cf = document.createElement("script");
      cf.id = "wz-cf-beacon"; cf.defer = true;
      cf.src = "https://static.cloudflareinsights.com/beacon.min.js";
      cf.setAttribute("data-cf-beacon", '{"token": "ad121ae2ee3c49eab1b791fd877d0009"}');
      document.head.appendChild(cf);
    }
  } catch (e) {}

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
  // grand bouton « Mon carnet » avec ses polaroïds
  function paintCarnet() {
    try {
      var b = document.getElementById("sc-carnet");
      if (!b) return;
      var city = (typeof state !== "undefined" && state.city) || "";
      var key = city === "paris" ? "paris" : "other:" + city;
      if (b.getAttribute("data-wzk") === key) return;
      b.setAttribute("data-wzk", key);
      var ph = [];
      if (city === "paris") ph = ["photo-paris-pont-neuf-nuit.jpg", "photo-paris-bar.jpg", "photo-paris-orsay-nuit.jpg"];
      else if (typeof CITY_PHOTOS !== "undefined" && CITY_PHOTOS[city]) ph = [CITY_PHOTOS[city]];
      var h = '<span class="wz-pol">';
      ph.forEach(function (u) { h += '<i style="background-image:url(\'' + String(u).replace(/'/g, "%27") + '\')"></i>'; });
      if (!ph.length) h += '<i class="wz-pol-empty">📖</i>';
      h += '</span><span class="wz-carnet-t"><b>📖 Mon carnet</b><small>Souvenirs, photos et amis</small></span><span class="wz-carnet-go">›</span>';
      b.innerHTML = h;
    } catch (e) {}
  }
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
        { id: "sc-envies", t: "💫 Mes envies" },
        { id: "sc-carnet", t: "📖 Mon carnet" }
      ];
      defs.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button"; b.id = d.id; b.className = "wz-sc"; var sp = d.t.indexOf(" "); b.innerHTML = '<span class="wz-e">' + d.t.slice(0, sp) + '</span><span class="wz-l">' + d.t.slice(sp + 1) + "</span>";
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
    paintCarnet();
    paintSoirTeaser();
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
      // titre : « Paris » au lieu de « Votre position actuelle (Paris) »
      try {
        var lv = document.getElementById("locate-value"), ll = document.getElementById("locate-label");
        if (lv && state.userPos && typeof CITIES !== "undefined" && typeof nearestCityKey === "function") {
          var cn = CITIES[nearestCityKey()].name;
          if (lv.textContent !== cn) lv.textContent = cn;
          if (ll && ll.textContent !== "📍 Autour de toi") ll.textContent = "📍 Autour de toi";
        }
      } catch (e2) {}
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


  // ---- vraies photos de Paris : lieux/expos/bars de Paris sans photo, et photo de nuit pour l'accueil le soir ----
  var PARIS_PH = {
    "Expo": ["photo-paris-louvre-reflet.jpg", "photo-paris-grand-palais-jour.jpg"],
    "À voir": ["photo-paris-sainte-chapelle-jour.jpg", "photo-paris-grand-palais-nuit.jpg", "photo-paris-orsay-nuit.jpg", "photo-paris-louvre-reflet.jpg"],
    "Bar": ["photo-paris-bar.jpg"]
  };
  function hashStr(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  try {
    if (typeof eventPhotoHTML === "function" && !eventPhotoHTML.__wzV2) {
      var origPhoto = eventPhotoHTML;
      var photoW = function (ev, st) {
        try {
          if (ev && !ev.photo && ev.city === "paris" && PARIS_PH[ev.category]) {
            var list = PARIS_PH[ev.category];
            ev = Object.assign({}, ev, { photo: list[hashStr(ev.id) % list.length] });
          }
        } catch (e) {}
        return origPhoto.call(this, ev, st);
      };
      photoW.__wzV2 = true;
      eventPhotoHTML = photoW; // eslint-disable-line no-global-assign
    }
  } catch (e) {}
  var parisDayPhoto = null;
  function updateParisHero() {
    try {
      if (typeof CITY_PHOTOS === "undefined" || !CITY_PHOTOS.paris) return;
      if (parisDayPhoto === null && CITY_PHOTOS.paris.indexOf("photo-paris-") === -1) parisDayPhoto = CITY_PHOTOS.paris;
      var h = new Date().getHours();
      var night = h >= 18 || h < 5;
      CITY_PHOTOS.paris = night ? "photo-paris-pont-neuf-nuit.jpg" : "photo-paris-sainte-chapelle-jour.jpg";
    } catch (e) {}
  }


  // ---- le Carnet a 4 onglets : Souvenirs · Hier soir · Amis · Passeport ----
  var SOIR_PH = {
    paris: [
      ["photo-paris-pont-neuf-nuit.jpg", "Le Pont Neuf"],
      ["photo-paris-grand-palais-nuit.jpg", "Le Grand Palais"],
      ["photo-paris-orsay-nuit.jpg", "Orsay"],
      ["photo-paris-louvre-reflet.jpg", "Le Louvre"],
      ["photo-paris-sainte-chapelle-jour.jpg", "La Sainte-Chapelle"],
      ["photo-paris-bar.jpg", "Un verre en ville"]
    ]
  };
  function cityNameNow() {
    try { return CITIES[state.city].name; } catch (e) { return "ta ville"; }
  }
  function soirHTML() {
    var c = (typeof state !== "undefined" && state.city) || "";
    var h = '<div class="wz-soir-h">Hier soir à ' + cityNameNow() + '</div><div class="wz-soir-s">Si j\'avais su, j\'y serais allé.</div>';
    var list = SOIR_PH[c];
    if (list) {
      h += '<div class="wz-soir-g">';
      list.forEach(function (p) { h += '<div class="wz-soir-i" style="background-image:url(\'' + p[0] + '\')"><span>' + p[1] + '</span></div>'; });
      h += '</div><div class="wz-soir-n">📷 Sélection Whazup</div>';
    } else {
      h += '<div class="wz-soir-e">📸 Bientôt les photos des soirées de ' + cityNameNow() + '.</div>';
    }
    h += '<div class="wz-soir-h2">👥 Tes amis</div><div id="wz-amis-feed" class="wz-feed"><div class="wz-soir-n2">Chargement…</div></div>';
    return h;
  }
  function esc(t) { return String(t || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fillFeed() {
    var box = document.getElementById("wz-amis-feed");
    if (!box || !window.__wzLoadFriendPhotos) return;
    window.__wzLoadFriendPhotos().then(function (list) {
      box = document.getElementById("wz-amis-feed");
      if (!box) return;
      if (list === null) { box.innerHTML = '<div class="wz-soir-n2">Connecte-toi avec ton compte pour voir les photos de tes amis.</div>'; return; }
      if (!list.length) { box.innerHTML = '<div class="wz-soir-n2">Aucune photo pour l\'instant. Ouvre un souvenir et touche « 🌙 Partager avec mes amis ».</div>'; return; }
      var me = (typeof auth !== "undefined" && auth.currentUser) ? auth.currentUser.uid : "";
      box.innerHTML = list.map(function (p, i) {
        var days = Math.max(1, Math.ceil((p.expiresAt - Date.now()) / 86400000));
        var mine = p.ownerUid === me;
        return '<div class="wz-fp"><div class="wz-fp-img" style="background-image:url(\'' + esc(p.photoUrl) + '\')"></div>' +
          '<div class="wz-fp-b"><b>' + (mine ? "Toi" : esc(p.ownerName)) + '</b>' + (p.placeName ? ' · 📍 ' + esc(p.placeName) : '') +
          '<small>encore ' + days + ' j</small></div>' +
          '<div class="wz-fp-a">' + (mine ? '<button data-a="del" data-i="' + i + '">Retirer</button>' : '<button data-a="keep" data-i="' + i + '">📖 Garder dans mon carnet</button>') + '</div></div>';
      }).join("");
      box.onclick = function (e) {
        var b = e.target.closest("button[data-a]"); if (!b) return;
        var p = list[+b.dataset.i];
        b.disabled = true;
        if (b.dataset.a === "keep") window.__wzKeepPhoto(p).then(function (ok) { b.textContent = ok ? "✓ Dans ton carnet" : "Réessayer"; b.disabled = ok; });
        else window.__wzUnshare(p._id).then(function () { fillFeed(); });
      };
    });
  }
  function setCarnetTab(scr, t) {
    scr.classList.toggle("wz-soir-on", t === "soir");
    var p = scr.querySelector("#wz-soir");
    if (p) { p.hidden = t !== "soir"; if (t === "soir") { p.innerHTML = soirHTML(); fillFeed(); } }
    scr.querySelectorAll("#wz-ctabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
  }
  function injectCarnetTabs(scr) {
    if (!scr || scr.querySelector("#wz-ctabs")) return;
    var anchor = scr.querySelector("#souvenirs-city-tabs");
    if (!anchor) return;
    var bar = document.createElement("div");
    bar.id = "wz-ctabs";
    bar.innerHTML = '<button type="button" data-t="souv" class="on">Souvenirs</button><button type="button" data-t="soir">Hier soir</button><button type="button" data-t="amis">Amis</button><button type="button" data-t="pass">Passeport</button>';
    var panel = document.createElement("div");
    panel.id = "wz-soir"; panel.hidden = true;
    anchor.parentNode.insertBefore(bar, anchor);
    anchor.parentNode.insertBefore(panel, anchor);
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-t]");
      if (!b) return;
      var t = b.dataset.t;
      if (t === "amis") { try { if (window.__renderFriendsScreen) window.__renderFriendsScreen(); } catch (er) {} return; }
      if (t === "pass") { try { if (window.__renderPassportScreen) window.__renderPassportScreen(); } catch (er) {} return; }
      setCarnetTab(scr, t);
    });
  }
  try {
    new MutationObserver(function () {
      var scr = document.getElementById("souvenirs-screen");
      if (scr && !scr.querySelector("#wz-ctabs")) injectCarnetTabs(scr);
    }).observe(document.body, { childList: true });
  } catch (e) {}
  window.__wzOpenSoir = function () {
    try {
      if (!window.__renderSouvenirsScreen) return;
      window.__renderSouvenirsScreen();
      setTimeout(function () {
        var scr = document.getElementById("souvenirs-screen");
        if (scr) { injectCarnetTabs(scr); setCarnetTab(scr, "soir"); }
      }, 30);
    } catch (e) {}
  };

  // ligne « Hier soir » sur l'accueil
  // Plus de bouton "Hier soir" sur l'accueil : seulement une pastille sur "Mon carnet"
  // quand des amis ont partagé des photos.
  function paintSoirTeaser() {
    try {
      var old = document.getElementById("sc-soir");
      if (old) old.remove();
      var c = document.getElementById("sc-carnet");
      if (!c) return;
      var bd = c.querySelector(".wz-badge");
      if (window.__wzFriendN) {
        if (!bd) { bd = document.createElement("span"); bd.className = "wz-badge"; c.appendChild(bd); }
        bd.textContent = window.__wzFriendN;
        bd.title = window.__wzFriendN + " photo(s) de tes amis";
      } else if (bd) bd.remove();
      if (!window.__wzFriendTried && window.__wzLoadFriendPhotos) {
        window.__wzFriendTried = true;
        setTimeout(function () {
          window.__wzLoadFriendPhotos().then(function (l) {
            var me = (typeof auth !== "undefined" && auth.currentUser) ? auth.currentUser.uid : "";
            var n = (l || []).filter(function (p) { return p.ownerUid !== me; }).length;
            if (n) { window.__wzFriendN = n; paintSoirTeaser(); }
          }).catch(function () {});
        }, 2500);
      }
    } catch (e) {}
  }

  // ---- on se branche APRÈS l'affichage de la liste (sans remplacer la fonction d'origine) ----
  try {
    if (typeof renderDiscover === "function" && !renderDiscover.__wzV2) {
      var origRender = renderDiscover;
      var w2 = function () {
        updateParisHero();
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

  // « Aujourd'hui » et « Ce soir » : d'abord ce qui commence bientôt (par heure), puis les sorties sans heure, puis ce qui a déjà commencé
  // (home-polish.js appelle cette fonction avant de couper la liste à 30 sorties)
  window.__wzSortSoon = function (list) {
    var p = state.selectedPeriod;
    if ((p !== "today" && p !== "wz-tonight") || !Array.isArray(list)) return list;
    var n = new Date(), pad = function (x) { return (x < 10 ? "0" : "") + x; };
    var hm = pad(n.getHours()) + ":" + pad(n.getMinutes()), today = isoPlus(0);
    var soon = [], none = [], started = [];
    list.forEach(function (ev) {
      if (ev.isPlace || ev.date !== today || !ev.time || ev.time === "00:00") none.push(ev);
      else if (ev.time >= hm) soon.push(ev);
      else started.push(ev);
    });
    var byTime = function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; };
    soon.sort(byTime); started.sort(byTime);
    return soon.concat(none, started);
  };

  // heure inconnue : on n'affiche plus « 00:00 » ni le « · » vide
  try {
    if (typeof exploreRowHTML === "function" && !exploreRowHTML.__wzV2) {
      var origRow = exploreRowHTML;
      var rowW = function () { return String(origRow.apply(this, arguments)).replace(/ · 00:00/g, ""); };
      rowW.__wzV2 = true;
      exploreRowHTML = rowW; // eslint-disable-line no-global-assign
    }
    if (typeof eventCardHTML === "function" && !eventCardHTML.__wzV2) {
      var origCard = eventCardHTML;
      var cardW = function () {
        return String(origCard.apply(this, arguments)).replace(/ · 00:00/g, "").replace(/(<div class="meta">[^<]*?)\s*·\s*<\/div>/, "$1</div>");
      };
      cardW.__wzV2 = true;
      eventCardHTML = cardW; // eslint-disable-line no-global-assign
    }
  } catch (e) {}

  // ---- barre du bas : Sortir · Favoris · 📸 Photo · Mon carnet ----
  function setupNav() {
    try {
      var nav = document.querySelector(".bottomnav");
      if (!nav || nav.getAttribute("data-wznav")) return;
      var items = nav.querySelectorAll(".nav-item");
      if (items.length < 4) return;
      nav.setAttribute("data-wznav", "1"); nav.id = "wz-nav";
      function lab(el, t) { var l = el.querySelector(".nav-label"); if (l) { l.removeAttribute("data-i18n"); l.textContent = t; } }
      var disc = nav.querySelector('[data-view="discover"]');
      var pub = nav.querySelector('[data-view="publish"]');
      var fav = nav.querySelector('[data-view="favorites"]');
      var car = document.getElementById("nav-carnet-btn");
      if (disc) lab(disc, "Sortir");
      if (fav) lab(fav, "Favoris");
      if (car) lab(car, "Mon carnet");
      if (pub) {
        pub.removeAttribute("data-view");
        pub.classList.add("wz-cam");
        var d = pub.querySelector(".dot"); if (d) d.textContent = "📸";
        lab(pub, "Photo");
        pub.onclick = function () { var f = document.getElementById("souvenir-fab"); if (f) f.click(); };
        // ordre : Sortir, Favoris, Photo, Mon carnet
        if (fav && fav.nextSibling !== pub) nav.insertBefore(fav, pub);
      }
      var fab = document.getElementById("souvenir-fab");
      if (fab) fab.style.setProperty("display", "none", "important");
      var st = document.createElement("style");
      st.textContent = "#souvenir-fab{display:none !important}";
      document.head.appendChild(st);
    } catch (e) {}
  }
  // "Publier" a quitté la barre : on le garde en bas de la liste.
  function setupPublishLink() {
    try {
      var host = document.getElementById("view-discover");
      if (!host || document.getElementById("wz-publink")) return;
      var b = document.createElement("button");
      b.type = "button"; b.id = "wz-publink";
      b.textContent = "➕ Proposer un événement";
      b.addEventListener("click", function () { try { showView("publish"); } catch (e) {} });
      host.appendChild(b);
    } catch (e) {}
  }
  setupNav(); setupPublishLink();
  setTimeout(function () { setupNav(); setupPublishLink(); }, 1500);
  try { new MutationObserver(function () { if (!document.querySelector(".bottomnav[data-wznav]")) setupNav(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}

  decorate();
  setTimeout(decorate, 1200);
})();

/* Soirées rangées par jour puis par heure */
(function(){try{var s=document.createElement("script");s.src="soiree-order.js?v=1";document.body.appendChild(s);}catch(e){}})();
