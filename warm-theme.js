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
