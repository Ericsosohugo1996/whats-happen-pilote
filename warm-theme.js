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
