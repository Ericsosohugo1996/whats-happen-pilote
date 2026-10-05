// ---- Accueil en 3 écrans pour les nouveaux visiteurs ----
// Écran 1 : ta ville · Écran 2 : tes envies · Écran 3 : tes rappels.
// Ne s'affiche qu'à la toute première visite (ou avec ?onboarding=1 à la fin de l'adresse pour le tester).
// Pour tout annuler : retirer la ligne <script src="onboarding.js"> dans index.html.
(function () {
  "use strict";

  var DONE_KEY = "wz_onboarded_v1";
  var PREFS_KEY = "wz_prefs_v1";

  // chaque envie correspond à des catégories réelles de la base
  var WISHES = [
    { id: "musique", label: "Concerts", color: "#9d4edd", cats: ["Musique"] },
    { id: "culture", label: "Expos et musées", color: "#2a9d8f", cats: ["Expo", "À voir"] },
    { id: "festival", label: "Festivals et spectacles", color: "#d97a2b", cats: ["Festival"] },
    { id: "marche", label: "Marchés", color: "#c9a227", cats: ["Marché"] },
    { id: "sport", label: "Sport", color: "#3a86ff", cats: ["Sport"] },
    { id: "soiree", label: "Bars et soirées", color: "#e85d3d", cats: ["Soirée", "Bar"] },
    { id: "brocante", label: "Brocantes", color: "#8d6e63", cats: ["Brocante"] }
  ];

  var REMINDERS = [
    { id: "weekend", title: "Mon week-end", sub: "Le jeudi à 18h : le meilleur de samedi et dimanche", soon: true },
    { id: "before", title: "Avant mes sorties", sub: "2 h avant un événement que tu as sauvegardé", soon: false },
    { id: "favorite", title: "Coups de cœur", sub: "Un événement qui colle à tes goûts, pas plus d'un par semaine", soon: true }
  ];

  var CSS = [
    "#wz-ob{position:fixed;inset:0;z-index:100000;overflow-y:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(180deg,#14213f 0%,#0b1526 100%);color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;box-sizing:border-box;padding:max(env(safe-area-inset-top),20px) 20px max(env(safe-area-inset-bottom),20px)}",
    "#wz-ob *{box-sizing:border-box}",
    "#wz-ob .in{max-width:480px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;gap:18px}",
    "#wz-ob .top{display:flex;justify-content:space-between;align-items:center;min-height:36px}",
    "#wz-ob .dots{display:flex;gap:6px}#wz-ob .dots i{width:26px;height:4px;border-radius:2px;background:#3a4560}#wz-ob .dots i.on{background:#f0c878}",
    "#wz-ob .ghost{border:0;background:none;color:#aeb5c8;font-size:14px;font-weight:700;cursor:pointer;padding:8px 4px;font-family:inherit}",
    "#wz-ob .eyebrow{margin:0;font-size:12.5px;letter-spacing:.08em;font-weight:700;color:#f0c878;text-transform:uppercase}",
    "#wz-ob h1{margin:4px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:1.15;font-weight:700;text-wrap:balance}",
    "#wz-ob .lead{margin:8px 0 0;font-size:15px;line-height:1.45;color:#c3c8d6}",
    "#wz-ob .grow{flex:1}",
    "#wz-ob .btn{border:0;border-radius:16px;padding:17px;background:linear-gradient(90deg,#f0c878,#e85d3d);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;width:100%}",
    "#wz-ob .btn[disabled]{opacity:.45;cursor:default}",
    "#wz-ob .loc{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:16px;padding:14px 16px;background:#1f6f78;color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;text-align:left}",
    "#wz-ob .or{text-align:center;font-size:13px;color:#8f98ad;letter-spacing:.04em}",
    "#wz-ob input[type=search]{width:100%;border:1.5px solid #3a4560;background:#14213f;color:#fff;border-radius:14px;padding:14px;font-size:17px;font-family:inherit}",
    "#wz-ob .res{display:flex;flex-direction:column;gap:8px}",
    "#wz-ob .city{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1.5px solid transparent;border-radius:14px;padding:12px 14px;background:#1b2a4d;color:#fff;cursor:pointer;font-family:inherit}",
    "#wz-ob .city.on{border-color:#f0c878}",
    "#wz-ob .city b{display:block;font-size:17px;font-family:Georgia,serif}#wz-ob .city span{font-size:13px;color:#aeb5c8}",
    "#wz-ob .chips{display:flex;flex-wrap:wrap;gap:10px}",
    "#wz-ob .chip{border-radius:999px;padding:12px 18px;border:1.5px solid #3a4560;background:transparent;color:#dfe3ee;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}",
    "#wz-ob .chip.on{border-color:transparent;color:#fff;font-weight:800}",
    "#wz-ob .rem{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1.5px solid #3a4560;border-radius:16px;padding:14px 16px;background:#1b2a4d;color:#fff;cursor:pointer;font-family:inherit}",
    "#wz-ob .rem.on{border-color:#2a9d8f}",
    "#wz-ob .rem b{display:block;font-size:16px}#wz-ob .rem span{display:block;font-size:13px;color:#aeb5c8;line-height:1.35;margin-top:2px}",
    "#wz-ob .rem em{font-style:normal;font-size:11.5px;font-weight:800;color:#f0c878;letter-spacing:.04em}",
    "#wz-ob .sw{margin-left:auto;flex-shrink:0;width:44px;height:26px;border-radius:13px;background:#3a4560;position:relative}",
    "#wz-ob .sw::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}",
    "#wz-ob .rem.on .sw{background:#2a9d8f}#wz-ob .rem.on .sw::after{left:21px}",
    "#wz-ob .note{border-radius:14px;padding:12px 14px;background:#162340;font-size:13.5px;line-height:1.45;color:#c3c8d6}",
    "#wz-ob .err{color:#ffb4a2;font-size:14px}",
    "#wz-ob button:focus-visible,#wz-ob input:focus-visible{outline:2px solid #f0c878;outline-offset:2px}"
  ].join("\n");

  var root = null;
  var ob = { step: 1, cityKey: null, usePos: false, q: "", wishes: {}, reminders: { weekend: true, before: true, favorite: true }, counts: null, err: "", busy: false };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function citiesObj() { try { return CITIES; } catch (e) { return {}; } }
  function cname(k) { var c = citiesObj()[k]; return c ? c.name : k; }

  function isReturning() {
    if (/[?&]onboarding=1/.test(location.search)) return false;
    try {
      if (localStorage.getItem(DONE_KEY)) return true;
      // signes d'un vrai visiteur de retour (l'appli écrit aussi des clés techniques dès la 1re ouverture : on les ignore)
      var USED = ["wh_lang", "wh_local_events", "wh_followed_city", "wh_favorites", "wh_been_there", "wh_referral_bonus_claimed"];
      for (var i = 0; i < USED.length; i++) {
        var v = localStorage.getItem(USED[i]);
        if (v && v !== "[]" && v !== "{}" && v !== "null") return true;
      }
    } catch (e) { return true; }
    return false;
  }
  function markDone(prefs) {
    try {
      localStorage.setItem(DONE_KEY, "1");
      if (prefs) localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  function ensureRoot() {
    if (!document.getElementById("wz-ob-css")) {
      var st = document.createElement("style"); st.id = "wz-ob-css"; st.textContent = CSS; document.head.appendChild(st);
    }
    if (!root) {
      root = document.createElement("div"); root.id = "wz-ob"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Bienvenue sur Whazup");
      document.body.appendChild(root);
      root.addEventListener("click", onClick);
      root.addEventListener("input", function (e) {
        if (e.target && e.target.id === "ob-q") { ob.q = e.target.value; renderResults(); }
      });
    }
    return root;
  }
  function close() { if (root) { root.remove(); root = null; } }

  function top(withBack) {
    var dots = [1, 2, 3].map(function (i) { return '<i class="' + (i <= ob.step ? "on" : "") + '"></i>'; }).join("");
    return '<div class="top">' + (withBack ? '<button type="button" class="ghost" data-act="back">‹ Retour</button>' : "<span></span>") +
      '<div class="dots" aria-hidden="true">' + dots + '</div><button type="button" class="ghost" data-act="skip">Passer</button></div>';
  }

  // ---- étape 1 : la ville ----
  function matches() {
    var q = fold(ob.q).trim(), C = citiesObj();
    var keys = Object.keys(C);
    if (q.length < 2) return [];
    return keys.filter(function (k) { return fold(C[k].name).indexOf(q) >= 0; })
      .sort(function (a, b) {
        var sa = fold(C[a].name).indexOf(q) === 0 ? 0 : 1, sb = fold(C[b].name).indexOf(q) === 0 ? 0 : 1;
        return sa - sb || C[a].name.localeCompare(C[b].name, "fr");
      }).slice(0, 5);
  }
  function cityRow(k) {
    var n = ob.counts && ob.counts.events && ob.counts.events[k];
    return '<button type="button" class="city' + (ob.cityKey === k && !ob.usePos ? " on" : "") + '" data-city="' + esc(k) + '"><div><b>' + esc(cname(k)) + "</b>" +
      (n ? "<span>" + n + " événements dans un rayon de 20 km</span>" : "<span>Lieux à voir et bars</span>") + "</div></button>";
  }
  function renderResults() {
    var el = root && root.querySelector("#ob-res");
    if (!el) return;
    var list = matches();
    el.innerHTML = list.length ? list.map(cityRow).join("") : (ob.q.trim().length >= 2 ? '<div class="note">Aucune ville de ce nom pour l’instant.</div>' : "");
    var go = root.querySelector("#ob-go");
    if (go) go.disabled = !(ob.cityKey || ob.usePos);
  }
  function step1() {
    var picked = ob.cityKey && !ob.usePos ? '<div class="res">' + cityRow(ob.cityKey) + "</div>" : "";
    root.innerHTML = '<div class="in">' + top(false) +
      '<div><p class="eyebrow">Étape 1 sur 3</p><h1>Où veux-tu sortir ?</h1><p class="lead">On te montre ce qui se passe autour de toi, ce soir et ce week-end.</p></div>' +
      '<button type="button" class="loc" data-act="locate"><span aria-hidden="true">📍</span><span>' + (ob.usePos ? "Position utilisée ✓" : "Utiliser ma position") + "</span></button>" +
      (ob.err ? '<div class="err" role="alert">' + esc(ob.err) + "</div>" : "") +
      '<div class="or">ou cherche une ville</div>' +
      '<input type="search" id="ob-q" placeholder="Lille, Bordeaux, Toulouse…" value="' + esc(ob.q) + '" autocomplete="off" aria-label="Chercher une ville">' +
      '<div class="res" id="ob-res"></div>' + (ob.q.trim().length < 2 ? picked : "") +
      '<div class="grow"></div><button type="button" class="btn" id="ob-go" data-act="next"' + (ob.cityKey || ob.usePos ? "" : " disabled") + ">Continuer</button></div>";
    renderResults();
  }

  // ---- étape 2 : les envies ----
  function step2() {
    var chips = WISHES.map(function (w) {
      var on = ob.wishes[w.id];
      return '<button type="button" class="chip' + (on ? " on" : "") + '" data-w="' + w.id + '"' + (on ? ' style="background:' + w.color + '"' : "") + ' aria-pressed="' + (on ? "true" : "false") + '">' + esc(w.label) + "</button>";
    }).join("");
    root.innerHTML = '<div class="in">' + top(true) +
      '<div><p class="eyebrow">Étape 2 sur 3</p><h1>Qu’est-ce qui te donne envie ?</h1><p class="lead">Choisis-en autant que tu veux. On s’en servira pour te proposer des sorties qui te ressemblent, par exemple dans « Prépare ton séjour ».</p></div>' +
      '<div class="chips">' + chips + "</div>" +
      '<div class="grow"></div><button type="button" class="btn" data-act="next">Continuer</button></div>';
  }

  // ---- étape 3 : les rappels ----
  function step3() {
    var rows = REMINDERS.map(function (r) {
      var on = ob.reminders[r.id];
      return '<button type="button" class="rem' + (on ? " on" : "") + '" data-r="' + r.id + '" aria-pressed="' + (on ? "true" : "false") + '"><div><b>' + esc(r.title) + "</b><span>" + esc(r.sub) + (r.soon ? '<br><em>BIENTÔT · ton choix est gardé</em>' : "") + '</span></div><i class="sw" aria-hidden="true"></i></button>';
    }).join("");
    root.innerHTML = '<div class="in">' + top(true) +
      '<div><p class="eyebrow">Étape 3 sur 3</p><h1>On te prévient, tu choisis quand</h1><p class="lead">Un seul message utile, au bon moment. Jamais de spam, tu peux tout couper en un geste.</p></div>' +
      '<div class="res">' + rows + "</div>" +
      '<div class="note">Ton téléphone te demandera ensuite l’autorisation d’envoyer des notifications. Tu peux la refuser et changer d’avis plus tard.</div>' +
      '<div class="grow"></div><button type="button" class="btn" data-act="finish"' + (ob.busy ? " disabled" : "") + ">Activer et voir mes sorties</button>" +
      '<button type="button" class="ghost" data-act="finish-nonotif" style="text-align:center">Pas maintenant</button></div>';
  }

  function render() {
    ensureRoot();
    (ob.step === 1 ? step1 : ob.step === 2 ? step2 : step3)();
    root.scrollTop = 0;
  }

  // ---- position ----
  function nearestKey(lat, lng) {
    var C = citiesObj(), best = null, bd = 1e9;
    Object.keys(C).forEach(function (k) {
      var d = Math.hypot(C[k].lat - lat, (C[k].lng - lng) * Math.cos(lat * Math.PI / 180));
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }
  function locate() {
    ob.err = "";
    if (!navigator.geolocation) { ob.err = "La position n’est pas disponible ici : cherche ta ville."; return render(); }
    navigator.geolocation.getCurrentPosition(function (p) {
      ob.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
      ob.usePos = true; ob.cityKey = nearestKey(ob.pos.lat, ob.pos.lng);
      ob.q = ""; render();
    }, function () { ob.err = "Position refusée : cherche ta ville ci-dessous."; render(); }, { timeout: 8000 });
  }

  // ---- fin : on applique ses choix ----
  function selectedCats() {
    var out = [];
    WISHES.forEach(function (w) { if (ob.wishes[w.id]) w.cats.forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); });
    return out;
  }
  function applyChoices() {
    try {
      if (ob.usePos && ob.pos) { state.userPos = { lat: ob.pos.lat, lng: ob.pos.lng }; state.city = ob.cityKey; }
      else { state.userPos = null; state.city = ob.cityKey; }
      state.selectedPeriod = null;
      try { __hasPickedCity = true; } catch (e) {}
      try { __hasPickedFilter = true; } catch (e) {}
      if (typeof hideBrandIntroScreen === "function") hideBrandIntroScreen();
      var ov = document.getElementById("arrival-overlay"); if (ov) ov.remove();
      if (typeof renderDiscover === "function") renderDiscover();
      if (typeof renderCategoryChips === "function") renderCategoryChips();
    } catch (e) { console.error("Accueil : impossible d'appliquer les choix", e); }
  }
  function savePrefsCloud(prefs) {
    try {
      if (typeof auth === "undefined" || typeof db === "undefined") return;
      var write = function (u) {
        if (!u) return;
        db.collection("users").doc(u.uid).set({ prefs: prefs, prefsAt: Date.now() }, { merge: true }).catch(function () {});
      };
      if (auth.currentUser) write(auth.currentUser);
      else { var off = auth.onAuthStateChanged(function (u) { if (u) { write(u); off(); } }); setTimeout(function () { try { off(); } catch (e) {} }, 8000); }
    } catch (e) {}
  }
  function finish(withNotif) {
    var prefs = {
      city: ob.cityKey, usePosition: !!ob.usePos,
      wishes: Object.keys(ob.wishes).filter(function (k) { return ob.wishes[k]; }),
      reminders: withNotif ? ob.reminders : { weekend: false, before: false, favorite: false }
    };
    markDone(prefs);
    applyChoices();
    savePrefsCloud(prefs);
    var anyOn = withNotif && (prefs.reminders.weekend || prefs.reminders.before || prefs.reminders.favorite);
    close();
    if (anyOn && "Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch (e) {}
    }
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest("button") : null;
    if (!t || !root || !root.contains(t)) return;
    var act = t.getAttribute("data-act");
    if (act === "skip") { markDone(null); return close(); }
    if (act === "back") { ob.step = Math.max(1, ob.step - 1); return render(); }
    if (act === "locate") return locate();
    if (act === "next") { if (ob.step === 1 && !(ob.cityKey || ob.usePos)) return; ob.step++; return render(); }
    if (act === "finish") return finish(true);
    if (act === "finish-nonotif") return finish(false);
    if (t.hasAttribute("data-city")) { ob.cityKey = t.getAttribute("data-city"); ob.usePos = false; ob.q = ""; return render(); }
    if (t.hasAttribute("data-w")) { var w = t.getAttribute("data-w"); ob.wishes[w] = !ob.wishes[w]; return render(); }
    if (t.hasAttribute("data-r")) { var r = t.getAttribute("data-r"); ob.reminders[r] = !ob.reminders[r]; return render(); }
  }

  function start() {
    if (isReturning()) return;
    fetch("/data/index.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (idx) { ob.counts = idx; render(); });
  }
  window.openOnboarding = function () { ob.step = 1; ob.cityKey = null; ob.usePos = false; ob.q = ""; ob.wishes = {}; start2(); };
  function start2() {
    fetch("/data/index.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (idx) { ob.counts = idx; render(); });
  }

  // on attend que l'appli soit prête (CITIES et state existent)
  function boot() { try { if (typeof CITIES === "undefined" || typeof state === "undefined") return setTimeout(boot, 300); } catch (e) { return setTimeout(boot, 300); } start(); }
  if (document.readyState === "complete") setTimeout(boot, 200);
  else window.addEventListener("load", function () { setTimeout(boot, 200); });
})();
