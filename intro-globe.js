// Le globe est retiré : le site s'ouvre directement sur le bonhomme qui fait un clin d'œil,
// grossit et éclate en confettis (écran de démarrage historique), puis sur le choix de la ville.
// Ce fichier ajoute en plus un gros bouton « Me localiser » tout en haut du choix de ville.
(function () {
  "use strict";
  var st = document.createElement("style");
  st.textContent =
    "#wz-locate-top{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;" +
    "margin:0 0 14px;padding:16px 18px;border:0;border-radius:16px;cursor:pointer;color:#fff;" +
    "font:800 16px 'Plus Jakarta Sans',system-ui,sans-serif;background:linear-gradient(135deg,#F2864B,#E85D3D);" +
    "box-shadow:0 10px 24px -8px rgba(232,93,61,.75)}" +
    "#wz-locate-top small{display:block;font:600 11.5px system-ui,sans-serif;opacity:.9;margin-top:2px}" +
    "#wz-locate-sep{text-align:center;color:rgba(255,255,255,.65);font:600 12.5px system-ui,sans-serif;margin:2px 0 12px}";
  document.head.appendChild(st);

  // Plus d'accueil en 3 étapes : « Me localiser » est déjà en haut du choix de ville.
  try { localStorage.setItem("wz_onboarded_v1", "1"); } catch (e) {}

  // On saute la page de bienvenue (photo de ville) : après le bonhomme, on arrive directement au choix de ville.
  try {
    var orig = window.showBrandIntroScreen;
    window.showBrandIntroScreen = function () {
      var v = document.getElementById("brand-choice-visit");
      if (v) { v.click(); return; }
      if (typeof orig === "function") orig();
    };
  } catch (e) {}

  function ensure() {
    var body = document.querySelector(".locate-body");
    var ci = document.getElementById("city-search-input"); if (ci && ci.placeholder.indexOf("35 000") < 0) ci.placeholder = "🔍 Chercher parmi plus de 35 000 villes…";
    if (!body || document.getElementById("wz-locate-top")) return;
    var b = document.createElement("button");
    b.type = "button"; b.id = "wz-locate-top";
    b.innerHTML = '<span style="font-size:22px">📍</span><span style="text-align:left">Me localiser<small>Les sorties autour de moi, tout de suite</small></span>';
    b.onclick = function () { var g = document.getElementById("btn-geoloc"); if (g) g.click(); };
    var sep = document.createElement("div");
    sep.id = "wz-locate-sep"; sep.textContent = "ou choisis parmi plus de 35 000 villes";
    body.insertBefore(sep, body.firstChild);
    body.insertBefore(b, body.firstChild);
  }
  function boot() {
    ensure();
    try { new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
