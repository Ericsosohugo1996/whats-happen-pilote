// Met en valeur « Photo souvenir » et « Mon carnet » : carte/bande sur l'accueil, bulle d'aide (une fois), invitation après « J'y étais ».
(function () {
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function addSouvenir(prefill) {
    try {
      if (prefill && typeof window.__openAddSouvenirModal === "function") return window.__openAddSouvenirModal(prefill);
      var f = document.getElementById("souvenir-fab"); if (f) f.click();
    } catch (e) {}
  }
  function openCarnet() { try { var b = document.getElementById("nav-carnet-btn"); if (b) b.click(); } catch (e) {} }

  // ---------- 1. barre du bas : « Photo souvenir » + pastille « nouveau » sur le carnet ----------
  function nav() {
    try {
      var bar = document.getElementById("wz-nav");
      if (bar && !document.getElementById("nav-idea")) {
        var b = document.createElement("button");
        b.type = "button"; b.id = "nav-idea"; b.className = "nav-item";
        b.innerHTML = '<span class="dot">💡</span><span class="nav-label">Une idée ?</span>';
        bar.insertBefore(b, bar.firstChild);
      }
      // favoris : un cœur dans la barre du haut
      var top = document.querySelector(".topbar"), fr = document.getElementById("btn-friends-header");
      if (top && fr && !document.getElementById("btn-fav-header")) {
        var h = document.createElement("button");
        h.type = "button"; h.id = "btn-fav-header"; h.className = "btn-ghost"; h.setAttribute("aria-label", "Mes favoris"); h.textContent = "❤️";
        h.style.marginRight = "6px";
        h.addEventListener("click", function () { var n = document.querySelector('#wz-nav .nav-item[data-view="favorites"]'); if (n) n.click(); else { try { showView("favorites"); } catch (e) {} } });
        fr.parentNode.insertBefore(h, fr);
      }
      var cam = document.querySelector("#wz-nav .wz-cam .nav-label");
      if (cam && cam.textContent !== "Photo souvenir") cam.textContent = "Photo souvenir";
      var car = document.getElementById("nav-carnet-btn");
      if (car && !ls("wz-carnet-seen") && !car.querySelector(".wz-new")) {
        var n = document.createElement("span"); n.className = "wz-new"; n.textContent = "nouveau"; car.appendChild(n);
        car.addEventListener("click", function () { ls("wz-carnet-seen", "1"); var x = car.querySelector(".wz-new"); if (x) x.remove(); }, { once: true });
      }
    } catch (e) {}
  }

  // ---------- 2. accueil : carte d'explication (carnet vide) ou bande « Tes derniers souvenirs » ----------
  var cache = null, loading = false, lastLoad = 0;
  function load(cb) {
    if (loading) return;
    if (typeof window.__loadSouvenirs !== "function") return;
    loading = true;
    window.__loadSouvenirs().then(function (r) { cache = Array.isArray(r) ? r : null; lastLoad = Date.now(); loading = false; cb && cb(); }, function () { loading = false; });
  }
  function pill() {
    try {
      var row = document.getElementById("wz-shortcuts");
      if (!row || document.getElementById("sc-carnet2") || document.body.classList.contains("wz-nocity")) return;
      var b = document.createElement("button");
      b.type = "button"; b.id = "sc-carnet2"; b.className = "wz-sc"; b.setAttribute("data-cp", "carnet");
      b.innerHTML = '<span class="wz-e">📖</span><span class="wz-l">Mon carnet</span>';
      row.appendChild(b);
    } catch (e) {}
  }
  function build() {
    pill();
    var host = document.getElementById("view-discover"), anchor = document.getElementById("wz-shortcuts");
    if (!host || !anchor || document.body.classList.contains("wz-nocity")) return;
    var box = document.getElementById("wz-carnet-promo");
    if (!box) { box = document.createElement("section"); box.id = "wz-carnet-promo"; anchor.parentNode.insertBefore(box, anchor.nextSibling); }
    var list = (cache || []).filter(function (s) { return s && s.photoUrl; });
    var sig = cache === null ? "null" : list.length + ":" + (list[0] && list[0].id);
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    if (!list.length) {
      box.className = "wz-cp-pitch";
      box.innerHTML = '<div class="wz-cp-k">Ton carnet de sorties</div><h2>Garde la trace de tes soirées</h2>' +
        '<p>Ce que tu as aimé, tu le retrouves ici, rien que pour toi.</p>' +
        '<div class="wz-cp-steps"><div><b>🎟️</b><span>Tu vas à une sortie</span></div><div><b>📸</b><span>Tu prends une photo</span></div><div><b>📖</b><span>Elle va dans ton carnet</span></div></div>' +
        '<button type="button" class="wz-cp-go" data-cp="add">📸 Ajouter mon premier souvenir</button>';
    } else {
      box.className = "wz-cp-strip";
      var total = cache.length;
      box.innerHTML = '<div class="wz-cp-lab"><span>📖 Tes derniers souvenirs</span><button type="button" data-cp="carnet">Mon carnet ›</button></div>' +
        '<div class="wz-cp-row"><button type="button" class="wz-cp-addtile" data-cp="add"><span>📸</span>Ajouter</button>' +
        list.slice(0, 8).map(function (s) {
          return '<button type="button" class="wz-cp-ph" data-cp="carnet" style="background-image:url(\'' + esc(s.photoUrl) + '\')"><i>' + esc(s.placeName || s.category || "") + "</i></button>";
        }).join("") + '</div><div class="wz-cp-count">' + total + " souvenir" + (total > 1 ? "s" : "") + "</div>";
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cp]"); if (!b) return;
    if (b.dataset.cp === "add") addSouvenir(); else if (b.dataset.cp === "carnet") openCarnet();
  });

  // ---------- 3. bulle d'aide, une seule fois ----------
  function tip() {
    try {
      if (ls("wz-tip-photo") || document.body.classList.contains("wz-nocity")) return;
      var vd = document.getElementById("view-detail"), am = document.getElementById("account-modal");
      if ((vd && !vd.classList.contains("hidden")) || (am && !am.classList.contains("hidden"))) return;
      var cam = document.querySelector("#wz-nav .wz-cam");
      if (!cam || document.getElementById("wz-tip") || document.getElementById("wz-idea") || document.getElementById("arrival-screen-overlay")) return;
      var t = document.createElement("div"); t.id = "wz-tip"; t.setAttribute("role", "dialog");
      t.innerHTML = '<b>Tu y étais ? Garde-le.</b>Prends une photo de ta sortie : elle rejoint ton carnet, pour la retrouver quand tu veux.<br><button type="button">Compris</button>';
      document.body.appendChild(t);
      function bye() { ls("wz-tip-photo", "1"); t.remove(); }
      t.querySelector("button").addEventListener("click", bye);
      // elle ne reste pas devant les événements : 6 secondes, ou dès que la personne touche l'écran ailleurs / fait défiler
      setTimeout(bye, 6000);
      setTimeout(function () {
        ["scroll", "touchmove"].forEach(function (ev) { window.addEventListener(ev, bye, { once: true, passive: true, capture: true }); });
        document.addEventListener("pointerdown", function (e) { if (!t.contains(e.target)) bye(); }, { once: true, capture: true });
      }, 800);
    } catch (e) {}
  }

  // ---------- 4. après « J'y étais » : proposer d'ajouter une photo ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#btn-been-there"); if (!b) return;
    setTimeout(function () {
      try {
        if (!b.classList.contains("active") || document.getElementById("wz-after")) return;
        var ev = (allEvents() || []).find(function (x) { return x.id === state.currentEventId; });
        var s = document.createElement("div"); s.id = "wz-after";
        s.innerHTML = '<span>Tu y étais ! 🎉</span><button type="button">📸 Ajouter une photo</button>';
        document.body.appendChild(s);
        s.querySelector("button").addEventListener("click", function () { s.remove(); addSouvenir({ placeName: ev && ev.place ? String(ev.place).split(",")[0] : "" }); });
        setTimeout(function () { s.remove(); }, 9000);
      } catch (x) {}
    }, 250);
  });

  // le logo ramène à l'accueil depuis n'importe quel écran (favoris, publier…)
  document.addEventListener("click", function (e) {
    try {
      var l = e.target.closest("#brand-home"); if (!l) return;
      var d = document.getElementById("view-discover");
      if (d && d.classList.contains("hidden")) { e.stopImmediatePropagation(); e.preventDefault(); showView("discover"); }
    } catch (x) {}
  }, true);

  function tick() { nav(); build(); if (Date.now() - lastLoad > 45000) load(build); }
  setInterval(tick, 1500);
  setTimeout(function () { load(build); tick(); }, 1200);
  setTimeout(tip, 6000);
  window.__wzCarnetRefresh = function () { lastLoad = 0; load(build); };
})();
