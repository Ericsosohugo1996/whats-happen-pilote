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
    "body.wz-nocity #wz-slogan{display:none !important}",
    // photos plus haut : la première rangée (Ce soir) vient juste après les boutons Ce soir / Demain / Ce week-end ;
    // « Je ne sais pas quoi faire » et les raccourcis passent juste après (rien n'est retiré)
    "html body.wz-v2 #view-discover > #wz-rows{display:contents}",
    "html body.wz-v2 #view-discover #wz-rows > .wzr{order:4;margin:4px 0 14px}",
    "html body.wz-v2 #view-discover #wz-rows > .wzr:first-child{order:3}",
    "html body.wz-v2:not(.wz-nocity) #view-discover > #wz-shortcuts{order:4}",
    // fiche d'un événement : barres du haut et du bas en bleu nuit, comme le reste de la fiche
    "html body.wz-v2:has(#view-detail:not(.hidden)) .topbar{background:rgba(14,23,48,.94) !important;box-shadow:0 1px 0 rgba(255,255,255,.06) !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) .topbar .btn-ghost{background:rgba(255,255,255,.12) !important;border:0 !important;color:#fff !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) .topbar .brand-word{color:#fff !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) #wz-nav{background:rgba(14,23,48,.97) !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) #wz-nav .nav-item .nav-label{color:#c3c8d6 !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) #wz-nav #nav-idea .nav-label{color:#F2C879 !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) #wz-nav .nav-item.wz-cam .nav-label{color:#F2C879 !important}",
    "html body.wz-v2:has(#view-detail:not(.hidden)) #unified-explore-btn{display:none !important}",
    "html body.wz-v2:not(.wz-nocity) #unified-explore-btn{display:none !important}",
    "html body.wz-v2 #view-detail .detail-hero{height:200px !important}",
    "html body.wz-v2 #view-detail .detail-body h1{font-size:26px !important;margin:8px 0 12px !important}"
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
