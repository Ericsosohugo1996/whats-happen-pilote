// warm-theme.js — charge le thème clair APRÈS les autres feuilles de style.
// POUR TOUT ANNULER : retirer la ligne <script src="warm-theme.js"> dans index.html.
(function () {
  "use strict";
  function add() {
    if (document.getElementById("wz-warm-css")) return;
    var l = document.createElement("link");
    l.id = "wz-warm-css"; l.rel = "stylesheet"; l.href = "warm-theme.css";
    document.head.appendChild(l);
  }
  function keepLast() {
    var l = document.getElementById("wz-warm-css");
    if (l && l !== document.head.lastElementChild) document.head.appendChild(l);
  }
  function start() {
    add();
    try { var mo = new MutationObserver(keepLast); mo.observe(document.head, { childList: true }); setTimeout(function () { mo.disconnect(); }, 8000); } catch (e) {}
    setTimeout(keepLast, 1500); setTimeout(keepLast, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
