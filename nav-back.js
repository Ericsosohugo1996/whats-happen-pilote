// Whazup — bouton « retour » du téléphone / du navigateur.
// Quand une fiche, une fenêtre ou la recherche s'ouvre, on ajoute une étape à l'historique ;
// le bouton « retour » la ferme au lieu de quitter le site. Ne change rien d'autre.
// Pour tout annuler : retirer la ligne <script src="nav-back.js"> dans index.html.
(function () {
  "use strict";
  if (!window.history || !history.pushState) return;

  var VIEWS = ["detail", "publish", "confirm", "favorites", "photos"];
  var MODALS = ["itinerary-modal", "account-modal", "moderation-modal", "newsletter-modal", "landmark-modal", "photo-lightbox"];
  var OVERLAYS = ["souvenirs-screen", "passport-screen", "friends-screen", "recap-overlay", "souvenirs-map-overlay", "explore-overlay", "explore-city-picker-overlay", "newfinds-overlay", "quest-overlay", "landing-mode-overlay", "layover-overlay"];
  var open = [];          // clés des couches ouvertes, dans l'ordre d'ouverture
  var bad = {};           // couches qu'on n'arrive pas à fermer : on ne les suit pas
  var pushed = 0;         // étapes ajoutées à l'historique
  var ignore = 0;         // retours déclenchés par nous (fermeture au clic)
  var watched = new WeakSet();
  var raf = 0;

  function shown(el) {
    if (!el || !el.isConnected) return false;
    if (el.classList && el.classList.contains("hidden")) return false;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    return el.getClientRects().length > 0;
  }
  function genericKey(el, i) { return "dlg:" + (el.id || ("n" + i)); }

  function current() {
    var now = [];
    VIEWS.forEach(function (v) { var el = document.getElementById("view-" + v); if (el && !el.classList.contains("hidden")) now.push("view:" + v); });
    MODALS.forEach(function (id) { var el = document.getElementById(id); if (el && shown(el)) now.push(id); });
    OVERLAYS.forEach(function (id) { var el = document.getElementById(id); if (el && el.isConnected) now.push(id); });
    if (document.getElementById("wz-sheet")) now.push("wz-sheet");
    [].slice.call(document.querySelectorAll('[role="dialog"]')).forEach(function (el, i) {
      if (el.id === "wz-sheet" || MODALS.indexOf(el.id) >= 0) return;
      watch(el);
      if (shown(el)) now.push(genericKey(el, i));
    });
    return now.filter(function (k) { return !bad[k]; });
  }

  function watch(el) {
    if (watched.has(el)) return;
    watched.add(el);
    try { new MutationObserver(schedule).observe(el, { attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"] }); } catch (e) {}
  }

  function sync() {
    raf = 0;
    var now = current();
    // ordre d'ouverture : on garde les anciennes dans leur ordre, on ajoute les nouvelles à la fin
    open = open.filter(function (k) { return now.indexOf(k) >= 0; });
    now.forEach(function (k) { if (open.indexOf(k) < 0) open.push(k); });
    var d = open.length;
    while (pushed < d) { pushed++; try { history.pushState({ wz: pushed }, "", location.href); } catch (e) { pushed--; break; } }
    if (pushed > d) { var diff = pushed - d; pushed = d; ignore += 1; try { history.go(-diff); } catch (e) { ignore = 0; } }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(sync); }

  function closeBtn(root) {
    var list = [].slice.call(root.querySelectorAll("button,a,[role=button]"));
    var pick = null;
    list.forEach(function (b) {
      if (pick) return;
      var t = (b.textContent || "").trim(), a = (b.getAttribute("aria-label") || ""), c = (b.className && b.className.baseVal === undefined ? b.className : "") + " " + (b.id || "");
      if (/^(✕|×|x|✖)$/i.test(t) || /fermer|close|retour|back/i.test(a) || /(^|[\s-_])(close|back|sh-x|retour)([\s-_]|$)/i.test(c) || /^(←\s*)?(retour|fermer)/i.test(t)) pick = b;
    });
    return pick;
  }

  function closeLayer(key) {
    try {
      if (key.indexOf("view:") === 0) { if (typeof showView === "function") { showView("discover"); return true; } return false; }
      if (key === "wz-sheet") { var x = document.querySelector("#wz-sheet .sh-x"); if (x) { x.click(); return true; } return false; }
      if (OVERLAYS.indexOf(key) >= 0) { var ov = document.getElementById(key); if (ov) { ov.remove(); return true; } return false; }
      var el = null;
      if (MODALS.indexOf(key) >= 0) el = document.getElementById(key);
      else if (key.indexOf("dlg:") === 0) { var id = key.slice(4); el = document.getElementById(id) || [].slice.call(document.querySelectorAll('[role="dialog"]'))[+id.slice(1)]; }
      if (!el) return false;
      var b = closeBtn(el);
      if (b) { b.click(); return true; }
    } catch (e) {}
    return false;
  }

  window.addEventListener("popstate", function (e) {
    if (ignore > 0) { ignore--; return; }
    var idx = (e.state && e.state.wz) || 0;
    if (idx >= pushed) { pushed = idx; schedule(); return; }  // « avancer » : on resynchronise
    pushed = idx;
    // on ferme la couche du dessus
    var top = open[open.length - 1];
    if (!top) return;
    var ok = closeLayer(top);
    setTimeout(function () {
      var still = current();
      if (still.indexOf(top) >= 0) { bad[top] = 1; }   // impossible à fermer : on ne la suit plus
      schedule();
    }, 150);
    if (!ok) { bad[top] = 1; schedule(); }
  });

  function start() {
    try { history.replaceState({ wz: 0 }, "", location.href); } catch (e) {}
    MODALS.concat(VIEWS.map(function (v) { return "view-" + v; })).forEach(function (id) {
      var el = document.getElementById(id); if (el) watch(el);
    });
    try { new MutationObserver(schedule).observe(document.body, { childList: true }); } catch (e) {}
    sync();
  }
  if (document.readyState === "complete") setTimeout(start, 300);
  else window.addEventListener("load", function () { setTimeout(start, 300); });
})();
