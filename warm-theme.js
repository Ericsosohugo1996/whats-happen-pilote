// warm-theme.js — charge le thème clair (et la version ordinateur plein écran) APRÈS les autres feuilles de style.
// POUR TOUT ANNULER : retirer la ligne <script src="warm-theme.js"> dans index.html.
(function () {
  "use strict";
  var mo = null;
  function link(id, href, media) {
    var l = document.getElementById(id);
    if (!l) {
      l = document.createElement("link");
      l.id = id; l.rel = "stylesheet"; l.href = href;
      if (media) l.media = media;
    }
    return l;
  }
  var warm, wide;
  function arrange() {
    // ordre voulu en fin de <head> : thème clair, puis version ordinateur. On ne déplace que si c'est nécessaire.
    var head = document.head;
    if (warm.parentNode === head && wide.parentNode === head && wide === head.lastElementChild && warm.nextElementSibling === wide) return;
    if (mo) mo.disconnect();
    head.appendChild(warm);
    head.appendChild(wide);
    if (mo) { try { mo.observe(head, { childList: true }); } catch (e) {} }
  }
  function start() {
    warm = link("wz-warm-css", "warm-theme.css");
    wide = link("wz-wide-css", "desktop-wide.css", "(min-width:1000px)");
    arrange();
    try { mo = new MutationObserver(arrange); mo.observe(document.head, { childList: true }); setTimeout(function () { if (mo) mo.disconnect(); }, 8000); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

// Bouton « ↑ Haut » : apparaît dès qu'on a un peu défilé, sur toutes les pages (accueil, détail, carnet, amis…).
// Il remonte la zone qui défile (la page ou un écran à part). Rien d'autre n'est modifié.
(function () {
  if (window.__wzBackTop) return; window.__wzBackTop = true;
  var css = document.createElement("style");
  css.textContent = "#wz-top{position:fixed;right:16px;bottom:96px;z-index:2147483000;width:46px;height:46px;border-radius:50%;border:0;cursor:pointer;" +
    "background:linear-gradient(135deg,#F2864B,#E85D3D);color:#fff;font:800 22px/1 system-ui,sans-serif;box-shadow:0 6px 18px rgba(232,93,61,.35);" +
    "display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(10px) scale(.9);pointer-events:none;transition:opacity .2s,transform .2s}" +
    "#wz-top.on{opacity:1;transform:none;pointer-events:auto}#wz-top:focus-visible{outline:3px solid #14213D;outline-offset:2px}" +
    "@media (prefers-reduced-motion:reduce){#wz-top{transition:none}}";
  document.head.appendChild(css);
  var btn = document.createElement("button");
  btn.id = "wz-top"; btn.type = "button"; btn.setAttribute("aria-label", "Remonter en haut de la page"); btn.textContent = "↑";
  document.body.appendChild(btn);
  var target = null, LIM = 500;
  function top(t) { return t === window ? (window.pageYOffset || document.documentElement.scrollTop || 0) : t.scrollTop; }
  function place() {
    var nav = document.querySelector(".bottomnav"), b = 24;
    try { if (nav && nav.offsetParent !== null || (nav && getComputedStyle(nav).position === "fixed")) { var r = nav.getBoundingClientRect(); if (r.height > 0 && r.top < innerHeight) b = Math.round(innerHeight - r.top + 14); } } catch (e) {}
    btn.style.bottom = b + "px";
  }
  function update() { if (target && top(target) > LIM) { place(); btn.classList.add("on"); } else btn.classList.remove("on"); }
  document.addEventListener("scroll", function (e) {
    var t = e.target === document || e.target === document.documentElement || e.target === document.body ? window : e.target;
    if (t !== window && !(t.scrollHeight > t.clientHeight + 50)) return;
    if (t === window || top(t) > LIM || t === target) target = t;
    update();
  }, true);
  // changement de page : on repart de zéro
  window.addEventListener("hashchange", function () { target = null; update(); });
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#wz-top")) return;
    if (e.target.closest && e.target.closest(".nav-item")) setTimeout(function () { target = window; update(); }, 350);
  }, true);
  btn.addEventListener("click", function () {
    var t = target || window, smooth = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    try { if (t === window) window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" }); else t.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" }); } catch (x) { window.scrollTo(0, 0); }
    // la zone de la page ET celle de l'écran ouvert, au cas où
    try { document.documentElement.scrollTop = 0; } catch (y) {}
  });
})();

// ---- « Accueil simple » : les catégories sont en haut ; la grande liste (Carte/Liste, jours, recherche, 8 000 événements) reste repliée
// derrière un bouton « Voir tous les événements », et s'ouvre toute seule dès qu'on filtre (catégorie, Ce soir/Demain, recherche…).
// POUR ANNULER : supprimer ce bloc (de « Accueil simple » jusqu'à la fin du fichier) : rien d'autre n'est touché.
(function () {
  "use strict";
  var B = "html body.wz-v2:not(.wz-nocity)";
  var st = document.createElement("style"); st.id = "wz-flow-css";
  st.textContent = [
    B + " #view-discover > .home-quickbar-section{order:2 !important;margin:2px 0 10px !important}",
    B + " #view-discover > .home-quickbar-section .home-quickbar-title{display:flex !important;align-items:center;justify-content:space-between;gap:10px;margin:0 16px 8px !important;font-size:16px !important}",
    "#wz-all-btn{border:0;background:none;color:#C2410C;font:700 13.5px/1 inherit;font-family:inherit;cursor:pointer;padding:6px 2px;white-space:nowrap}",
    "#wz-all-btn:focus-visible,#wz-all-list:focus-visible{outline:2px solid #14213D;outline-offset:2px;border-radius:12px}",
    // liste repliée
    B + ".wz-lc #view-discover > :is(.toolbar,#filters-panel,#map-mock,#btn-see-list,#week-strip-banner,#free-search-wrap,#event-list-featured,#event-list,#wz-more){display:none !important}",
    "#wz-all-list{display:none}",
    B + ".wz-lc #view-discover > #wz-all-list{display:flex;order:5;align-self:center;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;width:min(560px,calc(100% - 32px));margin:6px 16px 16px;padding:14px 18px;border-radius:999px;border:1.5px solid #E85D3D;background:#fff;color:#C2410C;font:800 15px/1.2 inherit;font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(232,93,61,.14)}",
    // cases de chargement des photos : teinte chaude et claire (et non bleu nuit)
    "#wz-rows .wzr-i{background:#EFE3D2 !important}",
    // cartes « lieux » (musées…) : la case photo faisait 188 px au lieu de 150 px et masquait le titre derrière une bande grise
    B + " #view-discover .event-card.event-card--place .thumb-wrap .thumb{height:150px !important}"
  ].join("\n");
  document.head.appendChild(st);

  var body = document.body;
  function collapse() { body.classList.add("wz-lc"); }
  function expand() { body.classList.remove("wz-lc"); }
  function isCollapsed() { return body.classList.contains("wz-lc"); }
  collapse();

  function addAll() {
    try {
      var host = document.getElementById("view-discover"); if (!host) return;
      if (!document.getElementById("wz-all-list")) {
        var b = document.createElement("button");
        b.type = "button"; b.id = "wz-all-list"; b.textContent = "Voir tous les événements ↓";
        host.appendChild(b);
      }
      var t = document.querySelector(".home-quickbar-section .home-quickbar-title");
      if (t && !document.getElementById("wz-all-btn")) {
        var a = document.createElement("button");
        a.type = "button"; a.id = "wz-all-btn"; a.textContent = "Tout voir ↓";
        a.setAttribute("aria-label", "Voir tous les événements");
        t.appendChild(a);
      }
    } catch (e) {}
  }
  addAll();
  var n = 0, iv = setInterval(function () { addAll(); if (++n > 30) clearInterval(iv); }, 500);

  function openAndGo() {
    expand();
    setTimeout(function () {
      var ch = document.getElementById("wz-chips");
      if (ch && ch.getBoundingClientRect().height > 0) {   // on reste en haut : les ronds de date restent visibles, la liste est juste dessous
        try { window.scrollTo({ top: Math.max(0, ch.getBoundingClientRect().top + (window.pageYOffset || 0) - 70), behavior: "smooth" }); return; } catch (e) {}
      }
      var el = document.querySelector("#view-discover > .toolbar") || document.getElementById("event-list-featured") || document.getElementById("event-list");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // dès qu'on utilise un filtre, la liste s'ouvre
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest("#wz-all-list,#wz-all-btn")) { e.preventDefault(); return openAndGo(); }
    if (!isCollapsed()) return;
    if (t.closest(".quick-cat,#home-category-quickbar,#wz-chips .wz-chip")) { setTimeout(openAndGo, 250); return; }  // on t'emmène aux résultats
    if (t.closest(".wzr-all,#wz-sheet .go,.stat[data-filter]")) expand();                                            // ces boutons font déjà défiler vers la liste
  }, true);

  // sécurité : si un filtre est actif (recherche, période, catégorie), on ne cache jamais le résultat
  function filtered() {
    try {
      if (state.selectedPeriod) return true;
      if (state.selectedCategories && state.selectedCategories.size) return true;
      if (typeof __searchQuery !== "undefined" && __searchQuery) return true;
    } catch (e) {}
    return false;
  }
  try {
    if (typeof renderDiscover === "function") {
      var orig = renderDiscover;
      renderDiscover = function () { var r = orig.apply(this, arguments); if (filtered()) expand(); return r; };
    }
  } catch (e) {}
})();

// ---- Voile de démarrage prolongé : si l'accueil met plus de 5,5 s à se construire (cache vidé, connexion lente),
// on garde l'écran « Whazup » au lieu de montrer une page à moitié construite. Limite : 12 s.
// POUR ANNULER : supprimer ce bloc.
(function () {
  "use strict";
  var d = document.documentElement, t0 = Date.now(), stop = false;
  var geoOk = false;
  try { navigator.permissions.query({ name: "geolocation" }).then(function (r) { geoOk = r.state === "granted"; }).catch(function () {}); } catch (e) {}
  function ready() {
    var b = document.body;
    if (!b || !b.classList.contains("wz-v2")) return false;
    if (b.classList.contains("wz-nocity")) {
      if (geoOk) return false;   // position déjà autorisée : l'appli va trouver la ville toute seule, on attend l'accueil
      return !!document.getElementById("wz-locate-top");
    }
    return !!document.getElementById("wz-searchbar") && !!document.getElementById("wz-chips");
  }
  function over() { return stop || Date.now() - t0 > 12000; }
  var mo = new MutationObserver(function () {
    if (!over() && !d.classList.contains("wz-boot") && !ready()) d.classList.add("wz-boot");
  });
  try { mo.observe(d, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
  var iv = setInterval(function () {
    if (ready() || over()) { stop = true; clearInterval(iv); try { mo.disconnect(); } catch (e) {} d.classList.remove("wz-boot"); }
  }, 100);
})();
