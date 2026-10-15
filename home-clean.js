// ---- Accueil épuré : on retire ce que la barre de recherche rend inutile ----
// - le bouton « Changer de ville » en haut (la barre « Où ? Quand ? » le remplace)
// - le grand bandeau de ville (la ville est dans la barre) ; le slogan et la météo passent sous la barre
// Rien n'est supprimé du code : on masque seulement. Pour tout annuler : retirer la ligne <script src="home-clean.js"> dans index.html.
(function () {
  "use strict";
  var P = "html body.wz-v2:not(.wz-nocity) ";
  var CSS = [
    ".wz-hide-top{display:none !important}",
    P + "#view-discover .locate-bar{margin:0 !important;min-height:0 !important;background:none !important;box-shadow:none !important}",
    P + "#view-discover .locate-bar-photo{display:none !important}",
    P + "#view-discover .locate-bar .wz-near{display:none !important}",
    "html body.wz-v2 #view-discover > #wz-slogan{order:0;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:2px 22px 10px;font-size:13.5px;color:#c3c8d6}",
    "#wz-slogan .sl-s{font-family:Fraunces,Georgia,serif;font-style:italic;color:#f0c878}",
    "#wz-slogan .sl-w{white-space:nowrap;font-weight:600}",
    "body.wz-nocity #wz-slogan{display:none !important}"
  ].join("\n");

  function hideChangeCity() {
    try {
      var top = document.querySelector(".topbar");
      if (!top) return;
      [].slice.call(top.querySelectorAll("button")).forEach(function (b) {
        if ((b.textContent || "").indexOf("Changer de ville") >= 0) b.classList.add("wz-hide-top");
      });
    } catch (e) {}
  }
  function slogan() {
    try {
      var host = document.getElementById("view-discover");
      if (!host) return;
      var el = document.getElementById("wz-slogan");
      if (!el) {
        el = document.createElement("div");
        el.id = "wz-slogan";
        el.innerHTML = '<span class="sl-s">Si j’avais su, j’y serais allé.</span><span class="sl-w"></span>';
        var bar = document.getElementById("wz-searchbar");
        if (bar && bar.nextSibling) host.insertBefore(el, bar.nextSibling);
        else if (bar) host.appendChild(el);
        else host.insertBefore(el, host.firstChild);
      } else {
        var bar2 = document.getElementById("wz-searchbar");
        if (bar2 && bar2.nextSibling !== el) host.insertBefore(el, bar2.nextSibling);
      }
      var w = document.getElementById("weather-mini");
      var t = w ? (w.textContent || "").replace(/\s+/g, " ").trim() : "";
      var s = el.querySelector(".sl-w");
      if (s && s.textContent !== t) s.textContent = t;
    } catch (e) {}
  }
  function tick() { hideChangeCity(); slogan(); }

  function start() {
    var st = document.createElement("style"); st.id = "wz-clean-css"; st.textContent = CSS; document.head.appendChild(st);
    tick();
    setInterval(tick, 1000);
  }
  if (document.readyState === "complete") setTimeout(start, 900);
  else window.addEventListener("load", function () { setTimeout(start, 900); });
})();
