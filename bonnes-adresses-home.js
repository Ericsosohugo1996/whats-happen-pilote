// bonnes-adresses-home.js — un bouton « Cafés & tables sympas » sur l'accueil, juste sous « Surprends-moi ».
// Il ouvre la page adresses.html (liste complète des adresses, filtrable par ville et par moment).
// POUR TOUT ANNULER : retirer la ligne <script src="bonnes-adresses-home.js"> dans index.html.
(function () {
  "use strict";
  var CSS = "html body.wz-v2:not(.wz-nocity) #view-discover > #wz-ba{order:2;display:flex;align-items:center;gap:12px;margin:0 16px 12px;width:calc(100% - 32px);box-sizing:border-box;padding:12px 14px;border:1px solid #EADFD3;border-radius:14px;background:#fff;color:#1F2433;text-align:left;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;cursor:pointer;text-decoration:none}" +
    "#wz-ba .ba-i{font-size:22px;line-height:1}#wz-ba b{display:block;font-size:15px}#wz-ba small{display:block;font-size:12.5px;color:#6B7280;margin-top:1px}#wz-ba .ba-go{margin-left:auto;color:#C9482A;font-weight:800}" +
    "body.wz-nocity #wz-ba{display:none !important}";
  var st = document.createElement("style"); st.id = "wz-ba-css"; st.textContent = CSS; document.head.appendChild(st);

  function paint() {
    try {
      var sc = document.getElementById("sc-surprise"), host = sc && sc.parentNode;
      if (!sc || !host || host.id !== "view-discover") return;
      var a = document.getElementById("wz-ba");
      if (!a) {
        a = document.createElement("a"); a.id = "wz-ba"; a.href = "adresses.html";
        a.innerHTML = '<span class="ba-i">📖</span><span><b>Cafés &amp; tables sympas</b><small>Où déjeuner, goûter ou dîner. Tu choisis toi-même.</small></span><span class="ba-go">→</span>';
      }
      if (a.previousElementSibling !== sc || a.parentNode !== host) host.insertBefore(a, sc.nextSibling);
    } catch (e) {}
  }
  function start() { paint(); setInterval(paint, 2000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 1600); });
  else setTimeout(start, 1600);
})();
