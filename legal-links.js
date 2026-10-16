// Liens « Mentions légales · Confidentialité » en bas de l'accueil et dans la fenêtre de compte.
// Pour tout annuler : retirer la ligne <script src="legal-links.js"> dans index.html.
(function () {
  "use strict";
  var CSS = "#wz-legal{order:90;text-align:center;font-size:12.5px;color:#9BA5C2;padding:6px 16px 120px}" +
    "#wz-legal a{color:#9BA5C2;text-decoration:underline;margin:0 8px}" +
    "html body.wz-v2 #view-discover > #wz-legal{order:90}" +
    "body.wz-nocity #wz-legal{padding-bottom:120px}" +
    ".wz-legal-acc{text-align:center;font-size:12px;margin:12px 0 4px}.wz-legal-acc a{color:inherit;opacity:.75;margin:0 6px}";
  function links() { return '<a href="mentions-legales.html">Mentions légales</a>·<a href="confidentialite.html">Confidentialité</a>'; }
  function add() {
    try {
      if (!document.getElementById("wz-legal-css")) { var st = document.createElement("style"); st.id = "wz-legal-css"; st.textContent = CSS; document.head.appendChild(st); }
      var host = document.getElementById("view-discover");
      if (host && !document.getElementById("wz-legal")) {
        var d = document.createElement("div"); d.id = "wz-legal"; d.innerHTML = links(); host.appendChild(d);
      }
      var modal = document.querySelector("#account-modal .modal-card, #account-modal > div");
      if (modal && !modal.querySelector(".wz-legal-acc")) {
        var p = document.createElement("div"); p.className = "wz-legal-acc"; p.innerHTML = links(); modal.appendChild(p);
      }
    } catch (e) {}
  }
  function start() { add(); setInterval(add, 2000); }
  if (document.readyState === "complete") setTimeout(start, 800);
  else window.addEventListener("load", function () { setTimeout(start, 800); });
})();
